import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useStorageContract } from '@/hooks/use-storage-contract';
import { useWeb3 } from '@/hooks/use-web3';
import { usePinata } from '@/hooks/use-pinata';
import { useSupabase } from '@/hooks/use-supabase';
import { Upload, File, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';

interface FileUploadProps {
  onUploadSuccess?: (tokenId: string, txHash: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const { isConnected, account, chainId, switchNetwork, connect, signer } = useWeb3();
  const { uploadFile, loading, error } = useStorageContract();
  const { saveFileRecord } = useSupabase();
  const { 
    uploadFile: uploadToPinata, 
    uploadMetadata, 
    createFileMetadata,
    getGatewayUrl,
    loading: pinataLoading 
  } = usePinata();
  
  const [file, setFile] = useState<File | null>(null);
  const [redundancyFactor, setRedundancyFactor] = useState([3]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const expectedChainId = parseInt(import.meta.env.VITE_CHAIN_ID || '1337');

  // Force component re-render when wallet state changes
  const walletKey = `${isConnected}-${account}-${chainId}`;

  // Add manual refresh function
  const handleRefreshConnection = () => {
    window.location.reload();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/*': ['.txt', '.md', '.json', '.csv'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'audio/*': ['.mp3', '.wav', '.flac'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB max
  });

  const handleUpload = async () => {
    if (!file || !isConnected) {
      toast.error('Please select a file and connect your wallet');
      return;
    }

    console.log('Starting upload with wallet:', account, 'on chain:', chainId);
    console.log('Contract addresses:', {
      storageNft: import.meta.env.VITE_STORAGE_NFT_ADDRESS,
      marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS
    });
    
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Verify wallet has sufficient balance
      if (!signer || !account) {
        throw new Error('Wallet not properly connected');
      }
      
      const balance = await signer.provider.getBalance(account);
      console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');
      
      if (balance < ethers.parseEther('0.001')) {
        throw new Error('Insufficient balance. You need at least 0.001 ETH for transaction fees.');
      }

      // Step 2: Upload file to IPFS via Pinata
      setUploadProgress(20);
      toast.info('Uploading file to IPFS...');
      
      const fileUploadResult = await uploadToPinata(file, {
        name: file.name,
        description: `Decentralized storage of ${file.name}`,
        metadata: {
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
        },
      });
      
      console.log('File uploaded to IPFS:', fileUploadResult.IpfsHash);
      setUploadProgress(40);
      
      // Step 3: Create metadata JSON
      const metadata = createFileMetadata(file, fileUploadResult.IpfsHash, {
        name: file.name,
        description: `Decentralized storage of ${file.name}`,
      });
      
      setUploadProgress(60);
      
      // Step 4: Upload metadata to IPFS
      toast.info('Uploading metadata to IPFS...');
      const metadataUploadResult = await uploadMetadata(metadata, {
        name: `${file.name}-metadata`,
        description: `Metadata for ${file.name}`,
      });
      
      console.log('Metadata uploaded to IPFS:', metadataUploadResult.IpfsHash);
      setUploadProgress(80);
      
      // Step 5: Generate encryption key (in production, use proper encryption)
      const encryptionKey = 'encrypted_key_' + Math.random().toString(36).padStart(16, '0');
      
      // Step 6: Create token URI using IPFS
      const tokenURI = `ipfs://${metadataUploadResult.IpfsHash}`;
      
      setUploadProgress(90);
      
      // Step 7: Upload to smart contract with enhanced error handling
      toast.info('Minting NFT on blockchain...');
      
      try {
        const result = await uploadFile(
          file.name,
          file.size,
          file.type,
          fileUploadResult.IpfsHash,
          metadataUploadResult.IpfsHash,
          encryptionKey,
          redundancyFactor[0],
          tokenURI
        );
        
        console.log('NFT minted with token ID:', result.tokenId);
        
        // Step 8: Save to Supabase database
        try {
          await saveFileRecord({
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            ipfs_hash: fileUploadResult.IpfsHash,
            upload_type: 'web3',
            token_id: result.tokenId,
            transaction_hash: result.txHash
          });
          console.log('File record saved to database');
        } catch (dbError) {
          console.warn('Failed to save to database:', dbError);
          // Continue anyway - NFT is minted
        }
        
        setUploadProgress(100);
        
        toast.success('File uploaded successfully!', {
          description: `Token ID: ${result.tokenId}`,
          action: {
            label: 'View on IPFS',
            onClick: () => window.open(getGatewayUrl(fileUploadResult.IpfsHash), '_blank'),
          },
        });
        
        onUploadSuccess?.(result.tokenId, result.txHash);
        
        // Reset form
        setFile(null);
        setRedundancyFactor([3]);
        
      } catch (contractError) {
        console.error('Smart contract error:', contractError);
        
        let errorMessage = 'On-chain registration failed';
        
        if (contractError instanceof Error) {
          const message = contractError.message.toLowerCase();
          
          if (message.includes('no contract found') || message.includes('contract not deployed')) {
            errorMessage = 'Smart contract not found. The contract may need to be redeployed to the local network.';
          } else if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
            errorMessage = 'Insufficient funds for transaction. Please ensure you have enough ETH for gas fees.';
          } else if (message.includes('user rejected') || message.includes('user denied')) {
            errorMessage = 'Transaction was rejected by user.';
          } else if (message.includes('network')) {
            errorMessage = 'Network error. Please check your connection to the Hardhat local network.';
          } else if (message.includes('revert')) {
            errorMessage = 'Transaction reverted. Please check contract requirements and try again.';
          } else {
            errorMessage = `Contract error: ${contractError.message}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (err) {
      console.error('Upload failed:', err);
      
      let displayMessage = 'Upload failed';
      if (err instanceof Error) {
        displayMessage = err.message;
      }
      
      toast.error('Upload Failed', {
        description: displayMessage,
        action: {
          label: 'Retry',
          onClick: () => handleUpload(),
        },
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateStorageCost = (): string => {
    if (!file) return '0';
    const cost = file.size * 0.001 * redundancyFactor[0]; // 0.001 ETH per byte
    return cost.toFixed(6);
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Please connect your wallet to upload files
            </p>
            <p className="text-xs text-muted-foreground">
              Debug: Wallet connected: {isConnected ? 'Yes' : 'No'}, Account: {account || 'None'}, Chain: {chainId || 'Unknown'}
            </p>
            <p className="text-xs text-blue-600">
              Expected Chain: {expectedChainId} (Hardhat Local)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if connected to wrong network
  if (isConnected && chainId && chainId !== expectedChainId) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">
                Wrong Network Detected
              </p>
              <p className="text-xs text-muted-foreground">
                Connected to Chain ID: {chainId} (Sepolia), Expected: {expectedChainId} (Hardhat Local)
              </p>
              <p className="text-xs text-blue-600">
                Current Detection: Account {account}, Chain {chainId}, Connected: {isConnected ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-muted-foreground">
                Please switch to the local Hardhat network to upload files
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => switchNetwork('0x539')} // 0x539 = 1337 in hex
                variant="outline"
                size="sm"
              >
                Switch to Local Network (Chain ID: 1337)
              </Button>
              <Button 
                onClick={handleRefreshConnection}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Connection
              </Button>
              <p className="text-xs text-muted-foreground">
                Or manually add: RPC URL: http://127.0.0.1:8545
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload File to Decentralized Storage
        </CardTitle>
        <CardDescription>
          Upload your file to the decentralized network and receive an NFT representing your stored data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="space-y-2">
              <File className="h-8 w-8 text-primary mx-auto" />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)} • {file.type}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-medium">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to select a file
              </p>
            </div>
          )}
        </div>

        {file && (
          <>
            {/* Redundancy Factor */}
            <div className="space-y-3">
              <Label htmlFor="redundancy">
                Redundancy Factor: {redundancyFactor[0]} copies
              </Label>
              <Slider
                id="redundancy"
                min={1}
                max={10}
                step={1}
                value={redundancyFactor}
                onValueChange={setRedundancyFactor}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher redundancy means better availability but higher cost
              </p>
            </div>

            {/* Storage Cost */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Cost:</span>
                <span className="font-mono text-sm">
                  {calculateStorageCost()} ETH
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>File Size: {formatFileSize(file.size)}</span>
                <span>× {redundancyFactor[0]} copies</span>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={uploading || loading || pinataLoading}
              className="w-full"
              size="lg"
            >
              {uploading || pinataLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to Decentralized Storage
                </>
              )}
            </Button>
          </>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};