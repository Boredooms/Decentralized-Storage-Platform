import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/use-web3';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { HardDrive, Coins, Wifi, Users, Database, Trophy, Monitor, Folder } from 'lucide-react';
import { ethers } from 'ethers';
import PhysicalStorageService from '../services/PhysicalStorageService';

const STORAGE_NETWORK_ABI = [
  "function registerStorageProvider(uint256 storageCapacity, string memory endpoint) external",
  "function getProviderStats(address provider) external view returns (uint256 totalStorage, uint256 usedStorage, uint256 uploadCount, bool isActive, uint256 nftTokenId)",
  "function getNetworkStats() external view returns(uint256 totalProviders, uint256 totalStorage, uint256 totalUsedStorage, uint256 totalFiles)",
  "function deactivateProvider() external"
];

const DESTORE_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function storageContributed(address account) external view returns (uint256)",
  "function getPendingRewards(address provider) external view returns (uint256)",
  "function claimRewards() external",
  "function isStorageProvider(address account) external view returns (bool)"
];

interface StorageStats {
  totalStorage: bigint;
  usedStorage: bigint;
  uploadCount: bigint;
  isActive: boolean;
  nftTokenId: bigint;
}

interface NetworkStats {
  totalProviders: bigint;
  totalStorage: bigint;
  totalUsedStorage: bigint;
  totalFiles: bigint;
}

export default function ContributeStorage() {
  const { isConnected, account, provider, chainId } = useWeb3();
  
  const [storageAmount, setStorageAmount] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [destoreBalance, setDestoreBalance] = useState<bigint>(BigInt(0));
  const [pendingRewards, setPendingRewards] = useState<bigint>(BigInt(0));
  const [isStorageProvider, setIsStorageProvider] = useState(false);
  const [storageContributed, setStorageContributed] = useState<bigint>(BigInt(0));
  const [deviceStats, setDeviceStats] = useState<any>(null);
  const [physicalStorage, setPhysicalStorage] = useState<any>(null);

  const STORAGE_NETWORK_ADDRESS = import.meta.env.VITE_STORAGE_NETWORK_ADDRESS;
  const DESTORE_TOKEN_ADDRESS = import.meta.env.VITE_DESTORE_TOKEN_ADDRESS;
  
  const physicalStorageService = PhysicalStorageService.getInstance();

  useEffect(() => {
    if (isConnected && account && provider) {
      loadStorageData();
      loadNetworkStats();
    }
    loadDeviceStats();
  }, [isConnected, account, provider]);

  const loadDeviceStats = async () => {
    try {
      const stats = physicalStorageService.getDeviceStats();
      const storage = physicalStorageService.getAvailableStorage();
      setDeviceStats(stats);
      setPhysicalStorage(storage);
    } catch (error) {
      console.error('Error loading device stats:', error);
    }
  };

  const loadStorageData = async () => {
    if (!provider || !account) return;

    try {
      const storageContract = new ethers.Contract(
        STORAGE_NETWORK_ADDRESS,
        STORAGE_NETWORK_ABI,
        provider
      );

      const tokenContract = new ethers.Contract(
        DESTORE_TOKEN_ADDRESS,
        DESTORE_TOKEN_ABI,
        provider
      );

      // Load provider stats
      const stats = await storageContract.getProviderStats(account);
      setStorageStats({
        totalStorage: stats[0],
        usedStorage: stats[1],
        uploadCount: stats[2],
        isActive: stats[3],
        nftTokenId: stats[4]
      });

      // Load token data
      const balance = await tokenContract.balanceOf(account);
      const pending = await tokenContract.getPendingRewards(account);
      const isProvider = await tokenContract.isStorageProvider(account);
      const contributed = await tokenContract.storageContributed(account);

      setDestoreBalance(balance);
      setPendingRewards(pending);
      setIsStorageProvider(isProvider);
      setStorageContributed(contributed);

    } catch (error) {
      console.error('Error loading storage data:', error);
    }
  };

  const loadNetworkStats = async () => {
    if (!provider) return;

    try {
      const storageContract = new ethers.Contract(
        STORAGE_NETWORK_ADDRESS,
        STORAGE_NETWORK_ABI,
        provider
      );

      const stats = await storageContract.getNetworkStats();
      setNetworkStats({
        totalProviders: stats[0],
        totalStorage: stats[1],
        totalUsedStorage: stats[2],
        totalFiles: stats[3]
      });
    } catch (error) {
      console.error('Error loading network stats:', error);
    }
  };

  const handleRegisterStorage = async () => {
    if (!provider || !account) return;
    
    const storageCapacityBytes = BigInt(parseFloat(storageAmount) * 1e9); // Convert GB to bytes
    
    if (storageCapacityBytes < BigInt(10 * 1e9)) {
      alert('Minimum 10GB storage required');
      return;
    }

    setIsRegistering(true);
    try {
      // First, contribute physical storage space
      await physicalStorageService.contributeStorage(parseFloat(storageAmount));
      
      const signer = await provider.getSigner();
      const storageContract = new ethers.Contract(
        STORAGE_NETWORK_ADDRESS,
        STORAGE_NETWORK_ABI,
        signer
      );

      const tx = await storageContract.registerStorageProvider(
        storageCapacityBytes,
        endpoint || `physical://device-${physicalStorageService.getDeviceStats().deviceId}`
      );

      await tx.wait();
      
      alert('Successfully registered as storage provider! Your physical device storage is now part of the network.');
      await loadStorageData();
      await loadDeviceStats();
      setStorageAmount('');
      setEndpoint('');
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert('Registration failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!provider || !account) return;

    setIsClaiming(true);
    try {
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(
        DESTORE_TOKEN_ADDRESS,
        DESTORE_TOKEN_ABI,
        signer
      );

      const tx = await tokenContract.claimRewards();
      await tx.wait();
      
      alert('Rewards claimed successfully!');
      await loadStorageData();
      
    } catch (error: any) {
      console.error('Claim failed:', error);
      alert('Claim failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsClaiming(false);
    }
  };

  const formatStorage = (bytes: bigint): string => {
    const gb = Number(bytes) / 1e9;
    return gb.toFixed(2) + ' GB';
  };

  const formatTokens = (wei: bigint): string => {
    return parseFloat(ethers.formatEther(wei)).toFixed(2);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Wifi className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
            <p className="text-muted-foreground">
              Connect your wallet to contribute storage to the Destore network
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Physical Device Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Your Device Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {physicalStorage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold">
                  {formatStorage(BigInt(physicalStorage.total))}
                </div>
                <div className="text-xs text-muted-foreground">Total Space</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {formatStorage(BigInt(physicalStorage.available))}
                </div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatStorage(BigInt(physicalStorage.contributed))}
                </div>
                <div className="text-xs text-muted-foreground">Contributed</div>
              </div>
            </div>
          )}
          
          {deviceStats && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Device ID:</span>
                <span className="font-mono text-xs">{deviceStats.deviceId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Contributing Storage:</span>
                <Badge variant={deviceStats.isContributing ? "default" : "secondary"}>
                  {deviceStats.isContributing ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Files Stored for Others:</span>
                <span className="font-medium">{deviceStats.storedFiles}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Storage Chunks:</span>
                <span className="font-medium">{deviceStats.storedChunks}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Network Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {networkStats ? networkStats.totalProviders.toString() : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Storage Providers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {networkStats ? formatStorage(networkStats.totalStorage) : '0 GB'}
              </div>
              <div className="text-sm text-muted-foreground">Total Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {networkStats ? formatStorage(networkStats.totalUsedStorage) : '0 GB'}
              </div>
              <div className="text-sm text-muted-foreground">Used Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {networkStats ? networkStats.totalFiles.toString() : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Files Stored</div>
            </div>
          </div>
          
          {networkStats && networkStats.totalStorage > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Network Usage</span>
                <span>{(Number(networkStats.totalUsedStorage) / Number(networkStats.totalStorage) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={Number(networkStats.totalUsedStorage) / Number(networkStats.totalStorage) * 100} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contribute Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Contribute Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isStorageProvider ? (
              <>
                <div>
                  <label className="text-sm font-medium">Storage Amount (GB)</label>
                  <Input
                    type="number"
                    placeholder="10"
                    min="10"
                    max="1000"
                    value={storageAmount}
                    onChange={(e) => setStorageAmount(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: 10GB, Maximum: 1TB
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Storage Endpoint (Optional)</label>
                  <Input
                    placeholder="ipfs://your-endpoint or leave empty"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    🔧 Physical Storage Contribution
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Your device's actual storage space will be used</li>
                    <li>• Other users can store files on your device via IPFS</li>
                    <li>• Files are encrypted and chunked for security</li>
                    <li>• Earn DESTORE tokens for hosting files</li>
                    <li>• Get exclusive Storage Provider NFT</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleRegisterStorage}
                  disabled={!storageAmount || parseFloat(storageAmount) < 10 || isRegistering}
                  className="w-full"
                >
                  {isRegistering ? 'Registering...' : 'Register as Storage Provider'}
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <h3 className="text-lg font-semibold mb-2">Active Storage Provider</h3>
                <Badge variant="secondary" className="mb-4">
                  Contributing {formatStorage(storageContributed)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  You're already contributing storage to the Destore network!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Storage Stats & Rewards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Your Storage & Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold">{formatTokens(destoreBalance)}</div>
                <div className="text-xs text-muted-foreground">DESTORE Balance</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold">{formatTokens(pendingRewards)}</div>
                <div className="text-xs text-muted-foreground">Pending Rewards</div>
              </div>
            </div>

            {storageStats && storageStats.isActive && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Storage Contribution:</span>
                    <span className="font-medium">{formatStorage(storageStats.totalStorage)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Currently Used:</span>
                    <span className="font-medium">{formatStorage(storageStats.usedStorage)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Files Hosted:</span>
                    <span className="font-medium">{storageStats.uploadCount.toString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>NFT Token ID:</span>
                    <span className="font-medium">#{storageStats.nftTokenId.toString()}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage Usage</span>
                      <span>{(Number(storageStats.usedStorage) / Number(storageStats.totalStorage) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Number(storageStats.usedStorage) / Number(storageStats.totalStorage) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </>
            )}

            {pendingRewards > 0 && (
              <Button 
                onClick={handleClaimRewards}
                disabled={isClaiming}
                className="w-full"
                variant="outline"
              >
                {isClaiming ? 'Claiming...' : `Claim ${formatTokens(pendingRewards)} DESTORE`}
              </Button>
            )}

            {!isStorageProvider && (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Start contributing storage to earn DESTORE tokens!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}