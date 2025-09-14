import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './use-web3';

// Contract ABI - in production, this would be imported from generated types
const STORAGE_NFT_ABI = [
  "function mintFileStorage(string memory name, uint256 size, string memory mimeType, string memory ipfsHash, string memory metadataHash, string memory encryptionKey, uint256 redundancyFactor, string memory tokenURI) public payable returns (uint256)",
  "function getFileMetadata(uint256 tokenId) public view returns (tuple(string name, uint256 size, string mimeType, string ipfsHash, string metadataHash, string encryptionKey, uint256 redundancyFactor, uint256 storagePrice, address uploader, uint256 uploadTime, bool isActive))",
  "function getFileByIPFS(string memory ipfsHash) public view returns (uint256)",
  "function getTotalFiles() public view returns (uint256)",
  "function getFilesByUploader(address uploader) public view returns (uint256[])",
  "function markFileRetrieved(uint256 tokenId) public",
  "function deactivateFile(uint256 tokenId) public",
  "function storagePricePerByte() public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "event FileUploaded(uint256 indexed tokenId, address indexed uploader, string name, uint256 size, string ipfsHash)",
  "event FileRetrieved(uint256 indexed tokenId, address indexed retriever, string ipfsHash)"
];

const MARKETPLACE_ABI = [
  "function registerProvider(uint256 capacity, uint256 pricePerByte, string memory location) external",
  "function createDeal(address provider, uint256 fileSize, uint256 duration) external payable returns (uint256)",
  "function submitProof(uint256 dealId, string memory proofHash) external",
  "function completeDeal(uint256 dealId) external",
  "function cancelDeal(uint256 dealId) external",
  "function getUserDeals(address user) external view returns (uint256[])",
  "function getProviderDeals(address provider) external view returns (uint256[])",
  "function getActiveProviders() external view returns (address[])",
  "function updateProviderCapacity(uint256 newCapacity) external",
  "function updateProviderPrice(uint256 newPrice) external",
  "function deactivateProvider() external",
  "event DealCreated(uint256 indexed dealId, address indexed provider, address indexed renter, uint256 fileSize, uint256 price)",
  "event DealCompleted(uint256 indexed dealId)",
  "event DealCancelled(uint256 indexed dealId)",
  "event ProviderRegistered(address indexed provider, uint256 capacity)"
];

interface FileMetadata {
  name: string;
  size: number;
  mimeType: string;
  ipfsHash: string;
  metadataHash: string;
  encryptionKey: string;
  redundancyFactor: number;
  storagePrice: number;
  uploader: string;
  uploadTime: number;
  isActive: boolean;
}

interface StorageDeal {
  dealId: number;
  provider: string;
  renter: string;
  fileSize: number;
  pricePerByte: number;
  duration: number;
  startTime: number;
  endTime: number;
  isActive: boolean;
  isCompleted: boolean;
  proofHash: string;
}

export const useStorageContract = () => {
  const { signer, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contract addresses - these would be loaded from environment or deployment
  const STORAGE_NFT_ADDRESS = import.meta.env.VITE_STORAGE_NFT_ADDRESS || '';
  const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS || '';

  const getStorageContract = useCallback(() => {
    if (!signer) throw new Error('Signer not available');
    return new ethers.Contract(STORAGE_NFT_ADDRESS, STORAGE_NFT_ABI, signer);
  }, [signer]);

  const getMarketplaceContract = useCallback(() => {
    if (!signer) throw new Error('Signer not available');
    return new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
  }, [signer]);

  const uploadFile = useCallback(async (
    name: string,
    size: number,
    mimeType: string,
    ipfsHash: string,
    metadataHash: string,
    encryptionKey: string,
    redundancyFactor: number,
    tokenURI: string
  ) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getStorageContract();
      const storagePrice = await contract.storagePricePerByte();
      const totalCost = BigInt(size) * BigInt(redundancyFactor) * storagePrice;

      const tx = await contract.mintFileStorage(
        name,
        size,
        mimeType,
        ipfsHash,
        metadataHash,
        encryptionKey,
        redundancyFactor,
        tokenURI,
        { value: totalCost }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'FileUploaded';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        return {
          tokenId: parsed?.args.tokenId.toString(),
          txHash: receipt.hash,
        };
      }

      throw new Error('File upload event not found');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, getStorageContract]);

  const getFileMetadata = useCallback(async (tokenId: number): Promise<FileMetadata> => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const contract = getStorageContract();
      const metadata = await contract.getFileMetadata(tokenId);
      
      return {
        name: metadata.name,
        size: Number(metadata.size),
        mimeType: metadata.mimeType,
        ipfsHash: metadata.ipfsHash,
        metadataHash: metadata.metadataHash,
        encryptionKey: metadata.encryptionKey,
        redundancyFactor: Number(metadata.redundancyFactor),
        storagePrice: Number(ethers.formatEther(metadata.storagePrice)),
        uploader: metadata.uploader,
        uploadTime: Number(metadata.uploadTime),
        isActive: metadata.isActive,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get file metadata';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isConnected, signer, getStorageContract]);

  const getFileByIPFS = useCallback(async (ipfsHash: string): Promise<number> => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const contract = getStorageContract();
      const tokenId = await contract.getFileByIPFS(ipfsHash);
      return Number(tokenId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find file';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isConnected, signer, getStorageContract]);

  const getUserFiles = useCallback(async (): Promise<number[]> => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const contract = getStorageContract();
      const files = await contract.getFilesByUploader(signer.address);
      return files.map((file: any) => Number(file));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user files';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isConnected, signer, getStorageContract]);

  const markFileRetrieved = useCallback(async (tokenId: number) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getStorageContract();
      const tx = await contract.markFileRetrieved(tokenId);
      await tx.wait();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark file as retrieved';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, getStorageContract]);

  const registerAsProvider = useCallback(async (
    capacity: number,
    pricePerByte: number,
    location: string
  ) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getMarketplaceContract();
      const tx = await contract.registerProvider(capacity, pricePerByte, location);
      await tx.wait();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register as provider';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, getMarketplaceContract]);

  const createStorageDeal = useCallback(async (
    provider: string,
    fileSize: number,
    duration: number
  ) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getMarketplaceContract();
      // Note: In a real implementation, you'd calculate the exact price
      const estimatedPrice = BigInt(fileSize) * BigInt(1000) * BigInt(duration); // Placeholder calculation
      
      const tx = await contract.createDeal(provider, fileSize, duration, {
        value: estimatedPrice
      });
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create storage deal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, getMarketplaceContract]);

  return {
    loading,
    error,
    uploadFile,
    getFileMetadata,
    getFileByIPFS,
    getUserFiles,
    markFileRetrieved,
    registerAsProvider,
    createStorageDeal,
  };
};
