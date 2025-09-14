import { v4 as uuidv4 } from 'uuid';

export interface DeviceStorageInfo {
  totalSpace: number;
  availableSpace: number;
  usedSpace: number;
  contributedSpace: number;
  deviceId: string;
  isOnline: boolean;
  endpoint: string;
}

export interface StorageContribution {
  deviceId: string;
  contributedBytes: number;
  availableBytes: number;
  files: Map<string, StoredFile>;
  isActive: boolean;
  lastSeen: number;
}

export interface StoredFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  chunkIds: string[];
  uploadedBy: string;
  storedAt: number;
  localPath?: string;
}

export interface FileChunk {
  chunkId: string;
  fileId: string;
  data: Blob;
  size: number;
  hash: string;
  deviceId: string;
}

class PhysicalStorageService {
  private static instance: PhysicalStorageService;
  private deviceId: string;
  private contributions: Map<string, StorageContribution> = new Map();
  private localFiles: Map<string, StoredFile> = new Map();
  private fileChunks: Map<string, FileChunk> = new Map();
  private storageQuota: number = 0;
  private usedStorage: number = 0;

  private constructor() {
    this.deviceId = this.generateDeviceId();
    this.initializeStorage();
  }

  static getInstance(): PhysicalStorageService {
    if (!PhysicalStorageService.instance) {
      PhysicalStorageService.instance = new PhysicalStorageService();
    }
    return PhysicalStorageService.instance;
  }

  private generateDeviceId(): string {
    const stored = localStorage.getItem('destore_device_id');
    if (stored) return stored;
    
    const newId = `device_${uuidv4()}`;
    localStorage.setItem('destore_device_id', newId);
    return newId;
  }

  private async initializeStorage() {
    try {
      // Request storage quota from browser
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        this.storageQuota = estimate.quota || 0;
        this.usedStorage = estimate.usage || 0;
      }
    } catch (error) {
      console.warn('Could not get storage estimate:', error);
    }
  }

  /**
   * Contribute physical storage space to the network
   */
  async contributeStorage(spaceInGB: number): Promise<boolean> {
    const spaceInBytes = spaceInGB * 1024 * 1024 * 1024;
    
    // Check if we have enough available space
    const availableSpace = this.storageQuota - this.usedStorage;
    if (spaceInBytes > availableSpace) {
      throw new Error(`Insufficient storage space. Available: ${Math.floor(availableSpace / (1024 * 1024 * 1024))}GB`);
    }

    // Register this device as a storage contributor
    const contribution: StorageContribution = {
      deviceId: this.deviceId,
      contributedBytes: spaceInBytes,
      availableBytes: spaceInBytes,
      files: new Map(),
      isActive: true,
      lastSeen: Date.now()
    };

    this.contributions.set(this.deviceId, contribution);
    
    // Persist contribution info
    this.saveContributionToLocal(contribution);
    
    return true;
  }

  /**
   * Store a file chunk on this device's physical storage
   */
  async storeFileChunk(
    fileId: string,
    chunkId: string,
    chunkData: Blob,
    uploadedBy: string
  ): Promise<boolean> {
    const contribution = this.contributions.get(this.deviceId);
    if (!contribution || !contribution.isActive) {
      throw new Error('Device is not contributing storage');
    }

    if (chunkData.size > contribution.availableBytes) {
      throw new Error('Insufficient available storage for this chunk');
    }

    try {
      // Store chunk data in IndexedDB (browser's physical storage)
      await this.storeChunkInIndexedDB(chunkId, chunkData);
      
      // Create chunk record
      const chunk: FileChunk = {
        chunkId,
        fileId,
        data: chunkData,
        size: chunkData.size,
        hash: await this.generateChunkHash(chunkData),
        deviceId: this.deviceId
      };

      this.fileChunks.set(chunkId, chunk);
      
      // Update contribution usage
      contribution.availableBytes -= chunkData.size;
      this.contributions.set(this.deviceId, contribution);
      
      console.log(`Stored chunk ${chunkId} (${chunkData.size} bytes) for file ${fileId}`);
      return true;
      
    } catch (error) {
      console.error('Failed to store chunk:', error);
      return false;
    }
  }

  /**
   * Store file metadata when file is completely uploaded
   */
  registerStoredFile(
    fileId: string,
    fileName: string,
    fileSize: number,
    chunkIds: string[],
    uploadedBy: string
  ): void {
    const storedFile: StoredFile = {
      fileId,
      fileName,
      fileSize,
      chunkIds,
      uploadedBy,
      storedAt: Date.now()
    };

    this.localFiles.set(fileId, storedFile);
    
    // Add to contribution record
    const contribution = this.contributions.get(this.deviceId);
    if (contribution) {
      contribution.files.set(fileId, storedFile);
    }
  }

  /**
   * Retrieve a file chunk from physical storage
   */
  async retrieveFileChunk(chunkId: string): Promise<Blob | null> {
    try {
      const chunkData = await this.getChunkFromIndexedDB(chunkId);
      if (chunkData) {
        console.log(`Retrieved chunk ${chunkId} from local storage`);
        return chunkData;
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve chunk:', error);
      return null;
    }
  }

  /**
   * Get available storage space on this device
   */
  getAvailableStorage(): { total: number; available: number; contributed: number } {
    const contribution = this.contributions.get(this.deviceId);
    return {
      total: this.storageQuota,
      available: this.storageQuota - this.usedStorage,
      contributed: contribution?.contributedBytes || 0
    };
  }

  /**
   * Get list of files stored on this device
   */
  getStoredFiles(): StoredFile[] {
    return Array.from(this.localFiles.values());
  }

  /**
   * Check if device can store additional data
   */
  canStoreData(sizeBytes: number): boolean {
    const contribution = this.contributions.get(this.deviceId);
    return contribution ? contribution.availableBytes >= sizeBytes : false;
  }

  /**
   * Simulate network discovery of other storage devices
   */
  discoverStorageDevices(): StorageContribution[] {
    // In a real implementation, this would discover devices on the network
    // For demo, we'll return mock devices
    const mockDevices: StorageContribution[] = [
      {
        deviceId: 'device_mock_1',
        contributedBytes: 5 * 1024 * 1024 * 1024, // 5GB
        availableBytes: 3 * 1024 * 1024 * 1024, // 3GB available
        files: new Map(),
        isActive: true,
        lastSeen: Date.now() - 60000 // 1 minute ago
      },
      {
        deviceId: 'device_mock_2',
        contributedBytes: 10 * 1024 * 1024 * 1024, // 10GB
        availableBytes: 8 * 1024 * 1024 * 1024, // 8GB available
        files: new Map(),
        isActive: true,
        lastSeen: Date.now() - 120000 // 2 minutes ago
      }
    ];

    // Add mock devices to contributions
    mockDevices.forEach(device => {
      if (!this.contributions.has(device.deviceId)) {
        this.contributions.set(device.deviceId, device);
      }
    });

    return Array.from(this.contributions.values()).filter(c => c.isActive);
  }

  /**
   * Distribute file across available storage devices
   */
  async distributeFile(
    file: File,
    uploadedBy: string,
    redundancy: number = 3
  ): Promise<{ fileId: string; chunks: string[]; devices: string[] }> {
    const fileId = `file_${uuidv4()}`;
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks: string[] = [];
    const usedDevices: string[] = [];

    // Discover available devices
    const availableDevices = this.discoverStorageDevices();
    if (availableDevices.length === 0) {
      throw new Error('No storage devices available');
    }

    // Split file into chunks
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunkData = file.slice(offset, Math.min(offset + chunkSize, file.size));
      const chunkId = `chunk_${fileId}_${chunks.length}`;
      
      // Find best device for this chunk
      const bestDevice = this.selectBestDevice(availableDevices, chunkData.size);
      if (!bestDevice) {
        throw new Error('No device has sufficient space for chunk');
      }

      // Store chunk on selected device
      if (bestDevice.deviceId === this.deviceId) {
        // Store locally
        await this.storeFileChunk(fileId, chunkId, chunkData, uploadedBy);
      } else {
        // In real implementation, would send to remote device
        console.log(`Would store chunk ${chunkId} on device ${bestDevice.deviceId}`);
      }

      chunks.push(chunkId);
      if (!usedDevices.includes(bestDevice.deviceId)) {
        usedDevices.push(bestDevice.deviceId);
      }
    }

    // Register the complete file
    this.registerStoredFile(fileId, file.name, file.size, chunks, uploadedBy);

    return { fileId, chunks, devices: usedDevices };
  }

  private selectBestDevice(devices: StorageContribution[], chunkSize: number): StorageContribution | null {
    return devices
      .filter(device => device.availableBytes >= chunkSize)
      .sort((a, b) => b.availableBytes - a.availableBytes)[0] || null;
  }

  private async generateChunkHash(chunk: Blob): Promise<string> {
    const arrayBuffer = await chunk.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async storeChunkInIndexedDB(chunkId: string, chunkData: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DestoreStorage', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('chunks')) {
          db.createObjectStore('chunks', { keyPath: 'chunkId' });
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['chunks'], 'readwrite');
        const store = transaction.objectStore('chunks');
        
        store.put({ chunkId, data: chunkData, timestamp: Date.now() });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  private async getChunkFromIndexedDB(chunkId: string): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DestoreStorage', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['chunks'], 'readonly');
        const store = transaction.objectStore('chunks');
        const getRequest = store.get(chunkId);
        
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result ? result.data : null);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  private saveContributionToLocal(contribution: StorageContribution): void {
    const contributions = this.getStoredContributions();
    contributions[contribution.deviceId] = {
      ...contribution,
      files: Array.from(contribution.files.entries())
    };
    localStorage.setItem('destore_contributions', JSON.stringify(contributions));
  }

  private getStoredContributions(): any {
    const stored = localStorage.getItem('destore_contributions');
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Get device statistics
   */
  getDeviceStats(): {
    deviceId: string;
    isContributing: boolean;
    contributedSpace: number;
    usedSpace: number;
    availableSpace: number;
    storedFiles: number;
    storedChunks: number;
  } {
    const contribution = this.contributions.get(this.deviceId);
    return {
      deviceId: this.deviceId,
      isContributing: !!contribution?.isActive,
      contributedSpace: contribution?.contributedBytes || 0,
      usedSpace: contribution ? (contribution.contributedBytes - contribution.availableBytes) : 0,
      availableSpace: contribution?.availableBytes || 0,
      storedFiles: this.localFiles.size,
      storedChunks: this.fileChunks.size
    };
  }
}

export default PhysicalStorageService;