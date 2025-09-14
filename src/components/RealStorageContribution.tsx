import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  HardDrive, 
  Coins, 
  Wifi, 
  Users, 
  Database, 
  Trophy, 
  Monitor, 
  Network,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useWeb3 } from '../hooks/use-web3';
import { ethers } from 'ethers';
import RealPhysicalStorageService from '../services/RealPhysicalStorageService';

const STORAGE_NETWORK_ABI = [
  "function registerStorageProvider(uint256 storageCapacity, string memory endpoint) external",
  "function getProviderStats(address provider) external view returns(uint256 totalStorage, uint256 usedStorage, uint256 uploadCount, bool isActive, uint256 nftTokenId)"
];

export default function RealStorageContribution() {
  const { isConnected, account, provider } = useWeb3();
  const [storageAmount, setStorageAmount] = useState('');
  const [isAllocating, setIsAllocating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [networkDevices, setNetworkDevices] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [allocationComplete, setAllocationComplete] = useState(false);
  const [onChainRegistered, setOnChainRegistered] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const realStorageService = RealPhysicalStorageService.getInstance();
  const STORAGE_NETWORK_ADDRESS = import.meta.env.VITE_STORAGE_NETWORK_ADDRESS;

  useEffect(() => {
    loadStorageData();
    const interval = setInterval(loadStorageData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStorageData = () => {
    // Load real storage statistics
    const stats = realStorageService.getRealStorageStats();
    setStorageStats(stats);

    // Load network devices
    const devices = realStorageService.getNetworkDevices();
    setNetworkDevices(devices);

    // Load network statistics
    const netStats = realStorageService.getNetworkStats();
    setNetworkStats(netStats);

    // Check if storage is allocated
    const allocated = localStorage.getItem('destore_storage_allocation');
    setAllocationComplete(!!allocated);

    // Check current device status
    const currentDevice = realStorageService.getCurrentDeviceInfo();
    setOnChainRegistered(currentDevice.onChainRegistered);
  };

  const handleAllocateStorage = async () => {
    if (!storageAmount || parseFloat(storageAmount) < 1) {
      alert('Please enter at least 1GB of storage');
      return;
    }

    setIsAllocating(true);
    try {
      const success = await realStorageService.allocateRealStorage(parseFloat(storageAmount));
      
      if (success) {
        alert(`Successfully allocated ${storageAmount}GB of physical storage!
This storage is now reserved for the network and cannot be used by your main system.`);
        setAllocationComplete(true);
        setStorageAmount('');
        loadStorageData();
      } else {
        alert('Failed to allocate storage. Please check available space.');
      }
    } catch (error: any) {
      console.error('Storage allocation failed:', error);
      alert(`Storage allocation failed: ${error.message}`);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleRegisterOnChain = async () => {
    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }

    if (!allocationComplete) {
      alert('Please allocate storage first');
      return;
    }

    if (!STORAGE_NETWORK_ADDRESS) {
      alert('Storage network contract address not found. Please check environment variables.');
      return;
    }

    setIsRegistering(true);
    try {
      console.log('Starting on-chain registration...');
      console.log('Contract address:', STORAGE_NETWORK_ADDRESS);
      console.log('Account:', account);
      
      const success = await realStorageService.registerOnChain(
        provider as ethers.BrowserProvider,
        STORAGE_NETWORK_ADDRESS,
        account
      );

      if (success) {
        alert('Successfully registered on-chain! You are now a verified storage provider.');
        setOnChainRegistered(true);
        loadStorageData();
      } else {
        alert('On-chain registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('On-chain registration failed:', error);
      
      let errorMessage = 'Registration failed: ';
      if (error.reason) {
        errorMessage += error.reason;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error';
      }
      
      // Check for common errors
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas fees';
      } else if (error.message?.includes('circuit breaker is open') || error.data?.cause?.isBrokenCircuitError) {
        errorMessage = 'MetaMask circuit breaker activated. Please reset MetaMask network connection.';
      } else if (error.message?.includes('Failed to fetch') || error.code === -32603) {
        errorMessage = 'Network connection failed. Please check MetaMask network configuration.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection to Hardhat Local network (Chain ID: 1337)';
      }
      
      // Store the error for display
      setLastError(errorMessage);
      
      // Show MetaMask fix if it's a network or contract error
      if (errorMessage.includes('No contract found') || errorMessage.includes('circuit breaker') || errorMessage.includes('Failed to fetch') || errorMessage.includes('Network connection failed')) {
        alert(`${errorMessage}

🦊 QUICK FIX - Add Hardhat Network to MetaMask:

1. Open MetaMask → Networks → Add Network
2. Network Name: Hardhat Local Network
3. RPC URL: http://127.0.0.1:8545
4. Chain ID: 1337
5. Currency: ETH

Then import test account:
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(This account has 10,000 ETH for testing)`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDeviceStatusColor = (device: any): string => {
    if (!device.isOnline) return 'bg-red-500';
    if (device.onChainRegistered) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getDeviceStatusText = (device: any): string => {
    if (!device.isOnline) return 'Offline';
    if (device.onChainRegistered) return 'Verified';
    return 'Online';
  };

  return (
    <div className="space-y-6">
      {/* Quick MetaMask Fix */}
      {lastError && (lastError.includes('No contract found') || lastError.includes('circuit breaker') || lastError.includes('Failed to fetch') || lastError.includes('Network connection failed')) && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              🚨 MetaMask Connection Issue Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-red-700 dark:text-red-300">
              {lastError.includes('circuit breaker') 
                ? 'MetaMask has blocked requests due to failed connections. Reset your network connection:'
                : 'The contract exists but MetaMask cannot connect to Hardhat. Follow these steps:'}
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded border">
              <h4 className="font-medium mb-3">
                {lastError.includes('circuit breaker') 
                  ? '🔄 Step 1: Reset MetaMask Network'
                  : '🦊 Step 1: Add Hardhat Network'}
              </h4>
              <Button 
                onClick={async () => {
                  try {
                    if (lastError.includes('circuit breaker')) {
                      // For circuit breaker, we need to switch networks first
                      alert('Please manually:\n1. Go to MetaMask Settings → Advanced → Reset Account\n2. Or delete Hardhat network and re-add it\n3. Then click the button below to add fresh network');
                    }
                    await window.ethereum?.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: '0x539',
                        chainName: 'Hardhat Local Network', 
                        rpcUrls: ['http://127.0.0.1:8545'],
                        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
                      }]
                    });
                    alert('✅ Network added! Now import test account.');
                  } catch (error: any) {
                    alert('❌ ' + error.message);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {lastError.includes('circuit breaker') 
                  ? '🔄 Reset & Add Hardhat Network'
                  : '🦊 Add Hardhat Network to MetaMask'}
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded border">
              <h4 className="font-medium mb-3">💰 Step 2: Import Test Account</h4>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Account Address:</div>
                <div className="bg-slate-100 p-2 rounded font-mono text-xs break-all">
                  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
                </div>
                <div className="text-xs text-muted-foreground">Private Key:</div>
                <div className="bg-slate-100 p-2 rounded font-mono text-xs break-all">
                  0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="ml-2"
                    onClick={() => navigator.clipboard.writeText('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  1. Open MetaMask → Account menu → "Import Account"<br/>
                  2. Paste the private key above<br/>
                  3. You'll have 10,000 ETH for testing
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-800 dark:text-green-200">
                ✅ After completing both steps, refresh this page and try registration again.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Storage Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Physical Storage Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm font-bold">{formatBytes(storageStats.totalQuota)}</div>
                <div className="text-xs text-muted-foreground">Total Quota</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm font-bold text-blue-600">{formatBytes(storageStats.used)}</div>
                <div className="text-xs text-muted-foreground">System Used</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm font-bold text-green-600">{formatBytes(storageStats.allocated)}</div>
                <div className="text-xs text-muted-foreground">Network Allocated</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm font-bold text-orange-600">{formatBytes(storageStats.available)}</div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
            </div>
          )}

          {/* Debug Section */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Debug Tools</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    console.log('=== Running Storage Debug ===');
                    await realStorageService.debugStorageEnvironment();
                    console.log('=== Debug Complete - Check browser console for details ===');
                  }}
                >
                  Debug Storage
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={async () => {
                    if (confirm('This will clear all storage data and reset the database. Continue?')) {
                      console.log('=== Resetting Storage Data ===');
                      try {
                        await realStorageService.resetStorageData();
                        alert('Storage data reset successfully! The page will reload.');
                        window.location.reload();
                      } catch (error) {
                        console.error('Reset failed:', error);
                        alert('Reset failed. Please check console for details.');
                      }
                    }
                  }}
                >
                  Reset Storage
                </Button>
                {isConnected && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      console.log('=== Testing Network Connection ===');
                      try {
                        // Test 1: Direct RPC connection
                        console.log('🌍 Testing direct RPC connection...');
                        const response = await fetch('http://127.0.0.1:8545', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_chainId',
                            params: [],
                            id: 1
                          })
                        });
                        
                        const rpcResult = await response.json();
                        console.log('✅ Direct RPC response:', rpcResult);
                        
                        // Test 2: MetaMask provider connection
                        console.log('🦊 Testing MetaMask provider...');
                        const testProvider = new (window as any).ethereum ? 
                          new ethers.BrowserProvider((window as any).ethereum) : null;
                        
                        if (!testProvider) {
                          throw new Error('MetaMask not available');
                        }
                        
                        const network = await testProvider.getNetwork();
                        console.log('✅ MetaMask network:', {
                          name: network.name,
                          chainId: network.chainId.toString()
                        });
                        
                        // Test 3: Contract connectivity
                        const STORAGE_NETWORK_ADDRESS = import.meta.env.VITE_STORAGE_NETWORK_ADDRESS;
                        if (STORAGE_NETWORK_ADDRESS) {
                          const code = await testProvider.getCode(STORAGE_NETWORK_ADDRESS);
                          console.log('✅ Contract verified, bytecode length:', code.length);
                        }
                        
                        alert(`✅ All Tests Passed!

Direct RPC: Chain ID ${parseInt(rpcResult.result, 16)}
MetaMask: Chain ID ${network.chainId}
Contract: ${STORAGE_NETWORK_ADDRESS ? 'Verified' : 'Not configured'}`);
                        
                      } catch (error: any) {
                        console.error('❌ Network test failed:', error);
                        
                        let errorMsg = 'Network Test Failed:\n\n';
                        
                        if (error.message?.includes('fetch')) {
                          errorMsg += '❌ Hardhat node not reachable\n→ Check if Hardhat is running on port 8545';
                        } else if (error.message?.includes('chain')) {
                          errorMsg += '❌ Wrong network in MetaMask\n→ Switch to Hardhat Local Network (Chain ID: 1337)';
                        } else if (error.message?.includes('MetaMask')) {
                          errorMsg += '❌ MetaMask connection issue\n→ Try refreshing the page or resetting MetaMask account';
                        } else {
                          errorMsg += `❌ ${error.message}\n→ Check console for details`;
                        }
                        
                        alert(errorMsg);
                      }
                    }}
                  >
                    Test Network
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Debug: Check browser console for detailed logs. Reset: Clear all storage data and database.
            </p>
          </div>

          {!allocationComplete ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Allocate Storage (GB)</label>
                <Input
                  type="number"
                  placeholder="10"
                  min="1"
                  max="100"
                  value={storageAmount}
                  onChange={(e) => setStorageAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This storage will be physically reserved and cannot be used by your system
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <h4 className="font-medium text-orange-900 dark:text-orange-100">
                    Real Storage Allocation
                  </h4>
                </div>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  <li>• Physical storage space will be permanently reserved</li>
                  <li>• This space cannot be used by your main system</li>
                  <li>• Other devices will store encrypted file chunks here</li>
                  <li>• You earn DESTORE tokens for providing storage</li>
                </ul>
              </div>

              <Button 
                onClick={handleAllocateStorage}
                disabled={!storageAmount || isAllocating}
                className="w-full"
              >
                {isAllocating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Allocating Storage...
                  </>
                ) : (
                  'Allocate Physical Storage'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900 dark:text-green-100">
                    Storage Allocated Successfully
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    {formatBytes(storageStats?.allocated || 0)} reserved for network use
                  </div>
                </div>
              </div>

              {!onChainRegistered && isConnected ? (
                <Button 
                  onClick={handleRegisterOnChain}
                  disabled={isRegistering}
                  className="w-full"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering On-Chain...
                    </>
                  ) : (
                    'Register On-Chain (Ethereum Testnet)'
                  )}
                </Button>
              ) : onChainRegistered ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      Registered On-Chain Successfully
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      You are now a verified storage provider
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Wifi className="h-8 w-8 mx-auto mb-2" />
                  <p>Connect your wallet to register on-chain</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Statistics */}
      {networkStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {networkStats.totalDevices || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Devices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatBytes(networkStats.totalStorage || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Storage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatBytes(networkStats.usedStorage || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Used Storage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {networkStats.totalFiles || 0}
                </div>
                <div className="text-sm text-muted-foreground">Files Stored</div>
              </div>
            </div>
            
            {networkStats.totalStorage > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Network Storage Usage</span>
                  <span>{((networkStats.usedStorage / networkStats.totalStorage) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={(networkStats.usedStorage / networkStats.totalStorage) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Discovered Network Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Discovered Network Devices ({networkDevices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {networkDevices.map((device, index) => (
              <div key={device.deviceId} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getDeviceStatusColor(device)}`}></div>
                  <Monitor className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Device {index + 1}</div>
                  <div className="text-xs text-muted-foreground">{device.deviceId.substring(0, 16)}...</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatBytes(device.contributedBytes)}</div>
                  <Badge variant="secondary" className="text-xs">
                    {getDeviceStatusText(device)}
                  </Badge>
                </div>
              </div>
            ))}
            
            {networkDevices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>No devices discovered yet.</p>
                <p className="text-sm">Open multiple browser tabs to see device discovery in action!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}