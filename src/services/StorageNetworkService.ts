import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

export interface StorageChunk {
  id: string;
  hash: string;
  size: number;
  provider: string;
  uploadTime: number;
}

export interface DistributedFile {
  id: string;
  fileName: string;
  totalSize: number;
  chunks: StorageChunk[];
  uploader: string;
  uploadTime: number;
  isActive: boolean;
}

export interface StorageProvider {
  address: string;
  totalStorage: number;
  usedStorage: number;
  endpoint: string;
  isActive: boolean;
  uploadCount: number;
}

class StorageNetworkService {
  private static instance: StorageNetworkService;
  private providers: Map<string, StorageProvider> = new Map();
  private files: Map<string, DistributedFile> = new Map();
  private chunks: Map<string, StorageChunk> = new Map();
  
  private constructor() {}
  
  static getInstance(): StorageNetworkService {
    if (!StorageNetworkService.instance) {
      StorageNetworkService.instance = new StorageNetworkService();
    }
    return StorageNetworkService.instance;
  }
  
  /**
   * Register a storage provider in the local network
   */
  registerProvider(provider: StorageProvider): void {
    this.providers.set(provider.address, provider);
  }
  
  /**
   * Get all active storage providers
   */
  getActiveProviders(): StorageProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isActive);
  }
  
  /**
   * Select best providers for file storage based on available capacity
   */
  selectProvidersForFile(fileSize: number, chunkCount: number, redundancy: number = 3): StorageProvider[] {
    const activeProviders = this.getActiveProviders();
    const chunkSize = Math.ceil(fileSize / chunkCount);
    const requiredProviders = Math.min(chunkCount * redundancy, activeProviders.length);
    
    // Sort providers by available storage and upload count (prefer less loaded)
    const sortedProviders = activeProviders
      .filter(p => p.totalStorage - p.usedStorage >= chunkSize)
      .sort((a, b) => {
        const scoreA = (a.totalStorage - a.usedStorage) / (a.uploadCount + 1);
        const scoreB = (b.totalStorage - b.usedStorage) / (b.uploadCount + 1);
        return scoreB - scoreA;
      });
    
    return sortedProviders.slice(0, requiredProviders);
  }
  
  /**
   * Split file into chunks for distributed storage
   */
  async splitFileIntoChunks(
    file: File, 
    chunkSize: number = 1024 * 1024 // 1MB default
  ): Promise<{ chunks: Blob[], hashes: string[] }> {
    const chunks: Blob[] = [];
    const hashes: string[] = [];
    
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      chunks.push(chunk);
      
      // Generate hash for chunk (simplified - in production use proper crypto)
      const arrayBuffer = await chunk.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      hashes.push(hashHex);
    }
    
    return { chunks, hashes };
  }
  
  /**
   * Upload file chunks to IPFS via selected providers
   */
  async uploadChunksToIPFS(
    chunks: Blob[], 
    hashes: string[], 
    providers: StorageProvider[]
  ): Promise<{ chunkHashes: string[], ipfsHashes: string[] }> {
    const chunkHashes: string[] = [];
    const ipfsHashes: string[] = [];
    
    // In a real implementation, this would upload to actual IPFS nodes
    // For demo purposes, we'll simulate the upload process
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkHash = hashes[i];
      const provider = providers[i % providers.length];
      
      try {
        // Simulate IPFS upload
        const ipfsHash = await this.simulateIPFSUpload(chunk, provider);
        
        chunkHashes.push(chunkHash);
        ipfsHashes.push(ipfsHash);
        
        // Store chunk information
        const storageChunk: StorageChunk = {
          id: uuidv4(),
          hash: chunkHash,
          size: chunk.size,
          provider: provider.address,
          uploadTime: Date.now()
        };
        
        this.chunks.set(chunkHash, storageChunk);
        
        // Update provider stats
        provider.usedStorage += chunk.size;
        provider.uploadCount += 1;
        this.providers.set(provider.address, provider);
        
      } catch (error) {
        console.error(`Failed to upload chunk ${i} to provider ${provider.address}:`, error);
        throw new Error(`Chunk upload failed: ${error}`);
      }
    }
    
    return { chunkHashes, ipfsHashes };
  }
  
  /**
   * Simulate IPFS upload (replace with actual IPFS client in production)
   */
  private async simulateIPFSUpload(chunk: Blob, provider: StorageProvider): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
    
    // Generate mock IPFS hash
    const arrayBuffer = await chunk.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const mockIPFSHash = 'Qm' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 44);
    
    return mockIPFSHash;
  }
  
  /**
   * Register a distributed file in the network
   */
  registerDistributedFile(
    fileId: string,
    fileName: string,
    fileSize: number,
    chunkHashes: string[],
    uploader: string
  ): void {
    const chunks = chunkHashes.map(hash => this.chunks.get(hash)).filter(Boolean) as StorageChunk[];
    
    const distributedFile: DistributedFile = {
      id: fileId,
      fileName,
      totalSize: fileSize,
      chunks,
      uploader,
      uploadTime: Date.now(),
      isActive: true
    };
    
    this.files.set(fileId, distributedFile);
  }
  
  /**
   * Retrieve distributed file information
   */
  getDistributedFile(fileId: string): DistributedFile | null {
    return this.files.get(fileId) || null;
  }
  
  /**
   * Get all files uploaded by a specific user
   */
  getUserFiles(userAddress: string): DistributedFile[] {
    return Array.from(this.files.values())
      .filter(file => file.uploader.toLowerCase() === userAddress.toLowerCase());
  }
  
  /**
   * Get network statistics
   */
  getNetworkStats(): {
    totalProviders: number;
    activeProviders: number;
    totalStorage: number;
    usedStorage: number;
    totalFiles: number;
    totalChunks: number;
  } {
    const allProviders = Array.from(this.providers.values());
    const activeProviders = allProviders.filter(p => p.isActive);
    
    return {
      totalProviders: allProviders.length,
      activeProviders: activeProviders.length,
      totalStorage: activeProviders.reduce((sum, p) => sum + p.totalStorage, 0),
      usedStorage: activeProviders.reduce((sum, p) => sum + p.usedStorage, 0),
      totalFiles: this.files.size,
      totalChunks: this.chunks.size
    };
  }
  
  /**
   * Find available storage for a file upload
   */
  findAvailableStorage(requiredSize: number): {
    available: boolean;
    providers: StorageProvider[];
    totalAvailable: number;
  } {
    const activeProviders = this.getActiveProviders();
    const totalAvailable = activeProviders.reduce(
      (sum, p) => sum + (p.totalStorage - p.usedStorage), 
      0
    );
    
    const suitableProviders = activeProviders.filter(
      p => p.totalStorage - p.usedStorage >= requiredSize / activeProviders.length
    );
    
    return {
      available: totalAvailable >= requiredSize && suitableProviders.length >= 3,
      providers: suitableProviders,
      totalAvailable
    };
  }
  
  /**
   * Recover file chunks from distributed storage
   */
  async recoverFileChunks(fileId: string): Promise<{
    success: boolean;
    chunks: { hash: string; data?: Blob; provider: string }[];
    missingChunks: string[];
  }> {
    const file = this.getDistributedFile(fileId);
    if (!file) {
      return { success: false, chunks: [], missingChunks: [] };
    }
    
    const recoveredChunks: { hash: string; data?: Blob; provider: string }[] = [];
    const missingChunks: string[] = [];
    
    for (const chunk of file.chunks) {
      try {
        // Simulate chunk recovery from IPFS
        const data = await this.simulateChunkRecovery(chunk.hash, chunk.provider);
        recoveredChunks.push({
          hash: chunk.hash,
          data,
          provider: chunk.provider
        });
      } catch (error) {
        console.error(`Failed to recover chunk ${chunk.hash}:`, error);
        missingChunks.push(chunk.hash);
        recoveredChunks.push({
          hash: chunk.hash,
          provider: chunk.provider
        });
      }
    }
    
    return {
      success: missingChunks.length === 0,
      chunks: recoveredChunks,
      missingChunks
    };
  }
  
  /**
   * Simulate chunk recovery from IPFS
   */
  private async simulateChunkRecovery(chunkHash: string, provider: string): Promise<Blob> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));
    
    // In a real implementation, this would fetch from IPFS
    // For demo, return a placeholder blob
    const dummyData = new Uint8Array(1024); // 1KB dummy data
    crypto.getRandomValues(dummyData);
    return new Blob([dummyData]);
  }
  
  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.providers.clear();
    this.files.clear();
    this.chunks.clear();
  }
}

export default StorageNetworkService;