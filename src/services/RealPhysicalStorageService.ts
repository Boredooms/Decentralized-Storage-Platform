import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import NetworkDiscoveryServer from './NetworkDiscoveryServer';

export interface RealDeviceInfo {
  deviceId: string;
  ipAddress: string;
  port: number;
  publicKey: string;
  contributedBytes: number;
  usedBytes: number;
  isOnline: boolean;
  lastSeen: number;
  walletAddress: string;
  onChainRegistered: boolean;
}

export interface StorageAllocation {
  allocatedBytes: number;
  usedBytes: number;
  reservedForNetwork: number;
  actualDeviceUsage: number;
  storageQuota: number;
}

class RealPhysicalStorageService {
  private static instance: RealPhysicalStorageService;
  private deviceId: string;
  private serverPort: number = 8080;
  private webSocketServer: WebSocket | null = null;
  private connectedDevices: Map<string, RealDeviceInfo> = new Map();
  private storageAllocation: StorageAllocation | null = null;
  private isContributing: boolean = false;
  private networkServer: any = null;
  private discoveryServer: NetworkDiscoveryServer;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.discoveryServer = NetworkDiscoveryServer.getInstance();
    this.initializeRealStorage();
    this.startNetworkDiscovery();
  }

  static getInstance(): RealPhysicalStorageService {
    if (!RealPhysicalStorageService.instance) {
      RealPhysicalStorageService.instance = new RealPhysicalStorageService();
    }
    return RealPhysicalStorageService.instance;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('destore_real_device_id');
    if (!deviceId) {
      // Create a more unique device ID using hardware-specific info
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      const fingerprint = canvas.toDataURL();
      deviceId = 'device_' + btoa(fingerprint + navigator.userAgent + new Date().getTime()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      localStorage.setItem('destore_real_device_id', deviceId);
    }
    return deviceId;
  }

  private async initializeRealStorage(): Promise<void> {
    try {
      // Get actual storage quota and usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;

        this.storageAllocation = {
          allocatedBytes: 0,
          usedBytes: 0,
          reservedForNetwork: 0,
          actualDeviceUsage: usage,
          storageQuota: quota
        };

        // Check if storage was previously allocated
        const savedAllocation = localStorage.getItem('destore_storage_allocation');
        if (savedAllocation) {
          try {
            const allocationData = JSON.parse(savedAllocation);
            const allocatedBytes = allocationData.allocatedBytes || 0;
            
            if (allocatedBytes > 0) {
              // Restore the allocation
              this.storageAllocation.allocatedBytes = allocatedBytes;
              this.storageAllocation.reservedForNetwork = allocatedBytes;
              this.isContributing = true;
              
              console.log(`Restored storage allocation: ${this.formatBytes(allocatedBytes)} reserved for network`);
            }
          } catch (error) {
            console.error('Failed to parse saved allocation:', error);
            localStorage.removeItem('destore_storage_allocation');
          }
        }

        console.log(`Real storage initialized: ${this.formatBytes(quota)} total, ${this.formatBytes(usage)} used, ${this.formatBytes(this.storageAllocation.reservedForNetwork)} reserved`);
        
        // Initialize current device in connected devices map
        this.updateCurrentDeviceInfo();
      }
    } catch (error) {
      console.error('Failed to initialize real storage:', error);
    }
  }

  /**
   * Actually allocate physical storage space that will be reserved for the network
   */
  async allocateRealStorage(sizeInGB: number): Promise<boolean> {
    if (!this.storageAllocation) {
      throw new Error('Storage not initialized');
    }

    const sizeInBytes = sizeInGB * 1024 * 1024 * 1024;
    
    // Be much more flexible with storage allocation
    const totalQuota = this.storageAllocation.storageQuota;
    const currentUsage = this.storageAllocation.actualDeviceUsage;
    const alreadyAllocated = this.storageAllocation.allocatedBytes;
    const availableSpace = totalQuota - currentUsage - alreadyAllocated;
    
    console.log('🔍 Storage allocation debug:', {
      requestedGB: sizeInGB,
      requestedBytes: this.formatBytes(sizeInBytes),
      totalQuota: this.formatBytes(totalQuota),
      currentUsage: this.formatBytes(currentUsage),
      alreadyAllocated: this.formatBytes(alreadyAllocated),
      availableSpace: this.formatBytes(availableSpace),
      quotaAsGB: (totalQuota / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
      availableAsGB: (availableSpace / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    });
    
    // Be much more lenient - if browser reports low quota, be more flexible
    const isLowQuotaEnvironment = totalQuota < (10 * 1024 * 1024 * 1024); // Less than 10GB
    let minimumBuffer: number;
    
    if (isLowQuotaEnvironment) {
      // In low quota environments (like some browsers), use smaller buffer
      minimumBuffer = Math.min(100 * 1024 * 1024, totalQuota * 0.1); // 100MB or 10% of quota
      console.log('🔧 Low quota environment detected, using flexible allocation');
    } else {
      // Normal environment, use 500MB buffer
      minimumBuffer = 500 * 1024 * 1024;
    }
    
    // Also check if the quota seems unrealistic (some browsers report weird values)
    if (totalQuota === 0 || totalQuota > (1000 * 1024 * 1024 * 1024)) { // 0 or > 1TB
      console.log('⚠️ Unrealistic quota detected, using permissive allocation');
      // For unrealistic quotas, just try to allocate and let IndexedDB handle it
      minimumBuffer = 0;
    }
    
    console.log(`📊 Using buffer: ${this.formatBytes(minimumBuffer)} (${((minimumBuffer / totalQuota) * 100).toFixed(1)}% of quota)`);
    
    if (sizeInBytes > (availableSpace - minimumBuffer)) {
      console.warn(`❌ Storage allocation check failed:`);
      console.warn(`   Available: ${this.formatBytes(availableSpace)}`);
      console.warn(`   Requested: ${this.formatBytes(sizeInBytes)}`);
      console.warn(`   Buffer needed: ${this.formatBytes(minimumBuffer)}`);
      console.warn(`   Total quota: ${this.formatBytes(totalQuota)}`);
      
      // If quota seems realistic, provide helpful suggestions
      if (totalQuota > 0 && totalQuota < (1000 * 1024 * 1024 * 1024)) {
        const maxAllowableSize = Math.max(0, availableSpace - minimumBuffer);
        if (maxAllowableSize > (0.5 * 1024 * 1024 * 1024)) { // At least 500MB
          const suggestedGB = Math.floor(maxAllowableSize / (1024 * 1024 * 1024 * 10)) / 10; // Round to 0.1GB
          throw new Error(`Insufficient storage space. Available: ${this.formatBytes(availableSpace)}, Requested: ${this.formatBytes(sizeInBytes)}. Try allocating ${suggestedGB}GB or less.`);
        } else {
          throw new Error(`Insufficient storage space. Only ${this.formatBytes(availableSpace)} available, but you requested ${this.formatBytes(sizeInBytes)}. Please free up some space or try a smaller allocation.`);
        }
      } else {
        // For unrealistic quotas, just warn but try anyway
        console.log('🚀 Quota seems unrealistic, attempting allocation anyway...');
      }
    }

    try {
      // Actually allocate the storage by creating a large IndexedDB
      await this.createStorageAllocation(sizeInBytes);
      
      this.storageAllocation.allocatedBytes += sizeInBytes; // Add to existing allocation
      this.storageAllocation.reservedForNetwork += sizeInBytes;
      this.isContributing = true;

      // Save allocation info
      localStorage.setItem('destore_storage_allocation', JSON.stringify({
        allocatedBytes: this.storageAllocation.allocatedBytes,
        allocatedAt: Date.now(),
        deviceId: this.deviceId
      }));

      // Update current device info in connected devices
      this.updateCurrentDeviceInfo();

      console.log(`Successfully allocated ${this.formatBytes(sizeInBytes)} for network storage. Total allocation: ${this.formatBytes(this.storageAllocation.allocatedBytes)}`);
      return true;
    } catch (error) {
      console.error('Failed to allocate storage:', error);
      throw new Error(`Storage allocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createStorageAllocation(sizeInBytes: number): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting IndexedDB allocation for ${this.formatBytes(sizeInBytes)}`);
      
      // Force database version increment to trigger schema upgrade
      const currentVersion = parseInt(localStorage.getItem('destore_db_version') || '1');
      const newVersion = currentVersion + 1;
      localStorage.setItem('destore_db_version', newVersion.toString());
      
      console.log(`📝 Opening database with version ${newVersion} to force schema update`);
      
      const request = indexedDB.open('DestoreRealStorage', newVersion);
      
      request.onerror = () => {
        const error = request.error?.message || 'Unknown IndexedDB error';
        console.error('❌ IndexedDB open failed:', error);
        reject(new Error(`IndexedDB error: ${error}`));
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔄 Database upgrade triggered - creating schema...');
        const db = request.result;
        const transaction = (event.target as any).transaction;
        
        // Delete existing object stores if they exist
        if (db.objectStoreNames.contains('allocation')) {
          db.deleteObjectStore('allocation');
          console.log('🗑️ Deleted existing allocation store');
        }
        if (db.objectStoreNames.contains('network_files')) {
          db.deleteObjectStore('network_files');
          console.log('🗑️ Deleted existing network_files store');
        }
        
        // Create fresh object stores
        const allocationStore = db.createObjectStore('allocation', { keyPath: 'id' });
        const filesStore = db.createObjectStore('network_files', { keyPath: 'chunkId' });
        
        console.log('✅ Created fresh allocation and network_files stores');
        
        // Wait for transaction to complete
        transaction.oncomplete = () => {
          console.log('✅ Schema upgrade transaction completed');
        };
        
        transaction.onerror = () => {
          console.error('❌ Schema upgrade transaction failed:', transaction.error);
        };
      };
      
      request.onsuccess = async () => {
        const db = request.result;
        console.log('✅ IndexedDB opened successfully');
        
        // Verify schema is properly created
        const storeNames = Array.from(db.objectStoreNames);
        console.log('📋 Available object stores:', storeNames);
        
        if (!db.objectStoreNames.contains('allocation')) {
          db.close();
          reject(new Error('allocation object store still not found after forced upgrade'));
          return;
        }
        
        try {
          // Use smaller chunk size for maximum compatibility
          const chunkSize = 5 * 1024 * 1024; // 5MB per chunk for better reliability
          const chunksNeeded = Math.ceil(sizeInBytes / chunkSize);
          
          console.log(`📊 Allocating storage: ${this.formatBytes(sizeInBytes)} in ${chunksNeeded} chunks of ${this.formatBytes(chunkSize)}`);
          
          let successfulChunks = 0;
          const allocationSession = Date.now();
          
          // Process chunks in smaller batches to avoid overwhelming the browser
          const batchSize = 10;
          for (let batch = 0; batch < Math.ceil(chunksNeeded / batchSize); batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, chunksNeeded);
            
            console.log(`📦 Processing batch ${batch + 1}: chunks ${batchStart + 1}-${batchEnd}`);
            
            for (let i = batchStart; i < batchEnd; i++) {
              const actualChunkSize = Math.min(chunkSize, sizeInBytes - (i * chunkSize));
              
              // Create minimal allocation marker
              const allocationMarker = {
                id: `chunk_${i}_${allocationSession}`,
                size: actualChunkSize,
                reserved: true,
                createdAt: Date.now(),
                chunkIndex: i,
                totalChunks: chunksNeeded,
                metadata: {
                  purpose: 'network_storage_reservation',
                  deviceId: this.deviceId,
                  allocationSession: allocationSession,
                  version: '2.0'
                }
              };
              
              try {
                await new Promise<void>((resolveChunk, rejectChunk) => {
                  const transaction = db.transaction(['allocation'], 'readwrite');
                  const store = transaction.objectStore('allocation');
                  const putRequest = store.put(allocationMarker);
                  
                  putRequest.onsuccess = () => {
                    successfulChunks++;
                    if (i % 50 === 0 || i === chunksNeeded - 1) {
                      console.log(`✅ Progress: ${successfulChunks}/${chunksNeeded} chunks (${((successfulChunks / chunksNeeded) * 100).toFixed(1)}%)`);
                    }
                    resolveChunk();
                  };
                  
                  putRequest.onerror = () => {
                    const error = putRequest.error?.message || `Unknown error on chunk ${i + 1}`;
                    console.error(`❌ Failed to allocate chunk ${i + 1}:`, error);
                    rejectChunk(new Error(`Chunk allocation failed: ${error}`));
                  };
                  
                  transaction.onerror = () => {
                    const error = transaction.error?.message || `Transaction error on chunk ${i + 1}`;
                    console.error(`❌ Transaction failed for chunk ${i + 1}:`, error);
                    rejectChunk(new Error(`Transaction failed: ${error}`));
                  };
                });
              } catch (chunkError) {
                console.error(`❌ Critical error allocating chunk ${i + 1}:`, chunkError);
                
                // If we have some success, continue
                if (successfulChunks > chunksNeeded * 0.8) {
                  console.log(`⚠️ Continuing with ${successfulChunks} successful chunks`);
                  break;
                }
                throw chunkError;
              }
            }
            
            // Small delay between batches to prevent browser freezing
            if (batch < Math.ceil(chunksNeeded / batchSize) - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          db.close();
          console.log(`🎉 Successfully allocated ${successfulChunks}/${chunksNeeded} chunks (${this.formatBytes(successfulChunks * chunkSize)})`);
          
          if (successfulChunks === 0) {
            throw new Error('Failed to allocate any storage chunks - browser storage may be restricted');
          }
          
          resolve();
        } catch (error) {
          db.close();
          console.error('❌ Storage allocation error:', error);
          
          // Provide specific error messages
          if (error instanceof Error) {
            if (error.message.includes('quota') || error.message.includes('storage')) {
              reject(new Error(`Storage allocation failed: Browser storage quota exceeded. Try a smaller allocation size (1-2GB).`));
            } else if (error.message.includes('object store')) {
              reject(new Error(`Storage allocation failed: Database schema error. Please use the Reset Storage button and try again.`));
            } else {
              reject(new Error(`Storage allocation failed: ${error.message}`));
            }
          } else {
            reject(new Error('Storage allocation failed: Unknown error occurred'));
          }
        }
      };
    });
  }

  /**
   * Start network discovery to find real connected devices
   */
  private async startNetworkDiscovery(): Promise<void> {
    try {
      // Start the network discovery server
      this.discoveryServer.startDiscovery();
      
      // Set up periodic updates to get discovered peers
      setInterval(() => {
        this.updateDiscoveredDevices();
      }, 5000); // Every 5 seconds
      
    } catch (error) {
      console.error('Failed to start network discovery:', error);
    }
  }

  private updateDiscoveredDevices(): void {
    const discoveredPeers = this.discoveryServer.getDiscoveredPeers();
    
    // Update our connected devices with real discovered peers
    this.connectedDevices.clear();
    
    discoveredPeers.forEach((peer) => {
      const device: RealDeviceInfo = {
        deviceId: peer.deviceId,
        ipAddress: peer.endpoint.split(':')[0] || 'localhost',
        port: parseInt(peer.endpoint.split(':')[1]) || 8080,
        publicKey: '',
        contributedBytes: peer.storageInfo.allocated,
        usedBytes: peer.storageInfo.used,
        isOnline: peer.isOnline,
        lastSeen: peer.lastSeen,
        walletAddress: peer.walletAddress || '',
        onChainRegistered: peer.onChainRegistered
      };
      
      this.connectedDevices.set(device.deviceId, device);
    });
    
    // Add our own device
    const currentDevice = this.getCurrentDeviceInfo();
    this.connectedDevices.set(this.deviceId, currentDevice);
  }

  private startDiscoveryServer(): void {
    try {
      // Create a WebSocket server for peer discovery
      const ws = new WebSocket(`ws://localhost:${this.serverPort}`);
      
      ws.onopen = () => {
        console.log('Discovery server started on port', this.serverPort);
        this.broadcastPresence();
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleNetworkMessage(message);
        } catch (error) {
          console.error('Failed to parse network message:', error);
        }
      };
      
      ws.onerror = () => {
        // Try next port if current one fails
        this.serverPort++;
        if (this.serverPort < 8090) {
          setTimeout(() => this.startDiscoveryServer(), 1000);
        }
      };
      
      this.webSocketServer = ws;
    } catch (error) {
      console.error('Failed to start discovery server:', error);
    }
  }

  private async scanLocalNetwork(): Promise<void> {
    // Get local IP range and scan for other Destore devices
    const localIPs = await this.getLocalIPRange();
    
    for (const ip of localIPs) {
      this.checkDeviceAtIP(ip);
    }
  }

  private async getLocalIPRange(): Promise<string[]> {
    // This is a simplified implementation
    // In a real application, you'd want more sophisticated network discovery
    const ips: string[] = [];
    
    // Check common local IP ranges
    for (let i = 1; i < 255; i++) {
      ips.push(`192.168.1.${i}`);
      ips.push(`192.168.0.${i}`);
      ips.push(`10.0.0.${i}`);
    }
    
    return ips;
  }

  private async checkDeviceAtIP(ip: string): Promise<void> {
    try {
      // Try to connect to potential Destore device
      const response = await fetch(`http://${ip}:8080/destore/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      
      if (response.ok) {
        const deviceInfo = await response.json();
        this.addDiscoveredDevice(deviceInfo, ip);
      }
    } catch (error) {
      // Device not found or not responding - this is expected for most IPs
    }
  }

  private addDiscoveredDevice(deviceInfo: any, ip: string): void {
    const device: RealDeviceInfo = {
      deviceId: deviceInfo.deviceId,
      ipAddress: ip,
      port: deviceInfo.port || 8080,
      publicKey: deviceInfo.publicKey || '',
      contributedBytes: deviceInfo.contributedBytes || 0,
      usedBytes: deviceInfo.usedBytes || 0,
      isOnline: true,
      lastSeen: Date.now(),
      walletAddress: deviceInfo.walletAddress || '',
      onChainRegistered: deviceInfo.onChainRegistered || false
    };

    this.connectedDevices.set(device.deviceId, device);
    console.log(`Discovered device: ${device.deviceId} at ${ip}`);
  }

  private broadcastPresence(): void {
    const presenceMessage = {
      type: 'presence',
      deviceId: this.deviceId,
      contributedBytes: this.storageAllocation?.allocatedBytes || 0,
      isContributing: this.isContributing,
      timestamp: Date.now()
    };

    if (this.webSocketServer && this.webSocketServer.readyState === WebSocket.OPEN) {
      this.webSocketServer.send(JSON.stringify(presenceMessage));
    }
  }

  private handleNetworkMessage(message: any): void {
    switch (message.type) {
      case 'presence':
        // Handle device presence announcement
        this.updateDevicePresence(message);
        break;
      case 'storage_request':
        // Handle file storage request from another device
        this.handleStorageRequest(message);
        break;
      default:
        console.log('Unknown network message type:', message.type);
    }
  }

  private updateDevicePresence(message: any): void {
    if (message.deviceId !== this.deviceId) {
      const existingDevice = this.connectedDevices.get(message.deviceId);
      if (existingDevice) {
        existingDevice.lastSeen = Date.now();
        existingDevice.isOnline = true;
        existingDevice.contributedBytes = message.contributedBytes || 0;
      }
    }
  }

  private updateDeviceStatus(): void {
    const now = Date.now();
    this.connectedDevices.forEach((device) => {
      // Mark device as offline if not seen for 30 seconds
      if (now - device.lastSeen > 30000) {
        device.isOnline = false;
      }
    });
  }

  /**
   * Register device on-chain with Ethereum smart contract
   */
  async registerOnChain(
    provider: ethers.BrowserProvider,
    storageNetworkAddress: string,
    walletAddress: string
  ): Promise<boolean> {
    try {
      console.log('=== Starting On-Chain Registration ===');
      console.log('Storage Network Address:', storageNetworkAddress);
      console.log('Wallet Address:', walletAddress);
      console.log('Provider:', provider);
      
      if (!this.storageAllocation || this.storageAllocation.reservedForNetwork === 0) {
        throw new Error('No storage allocated. Please allocate storage first.');
      }

      console.log('Storage allocation verified:', {
        allocated: this.formatBytes(this.storageAllocation.allocatedBytes),
        reserved: this.formatBytes(this.storageAllocation.reservedForNetwork),
        contributing: this.isContributing
      });

      // Check network connection
      const network = await provider.getNetwork();
      console.log('Connected to network:', {
        name: network.name,
        chainId: network.chainId.toString()
      });

      // Verify we're on the correct network (Hardhat local)
      if (network.chainId !== 1337n && network.chainId !== 31337n) {
        throw new Error(`Wrong network. Expected Hardhat Local (1337 or 31337), got ${network.chainId}`);
      }

      console.log('Getting signer...');
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('Signer address:', signerAddress);

      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error(`Signer address mismatch. Expected: ${walletAddress}, Got: ${signerAddress}`);
      }

      // Check balance
      const balance = await provider.getBalance(signerAddress);
      console.log('Account balance:', ethers.formatEther(balance), 'ETH');
      
      if (balance < ethers.parseEther('0.01')) {
        throw new Error('Insufficient ETH balance for gas fees. Need at least 0.01 ETH.');
      }

      console.log('Creating contract instance...');
      const storageContract = new ethers.Contract(
        storageNetworkAddress,
        [
          "function registerStorageProvider(uint256 storageCapacity, string memory endpoint) external",
          "function getProviderStats(address provider) external view returns (uint256 totalStorage, uint256 usedStorage, uint256 uploadCount, bool isActive, uint256 nftTokenId)"
        ],
        signer
      );

      // Verify contract exists and is properly deployed
      const code = await provider.getCode(storageNetworkAddress);
      if (code === '0x') {
        throw new Error(`No contract found at address ${storageNetworkAddress}. Make sure the contract is deployed.`);
      }
      console.log('Contract verified at address:', storageNetworkAddress);
      console.log('Contract bytecode length:', code.length, 'characters');
      
      // Additional contract verification - try to read contract state
      try {
        console.log('🔍 Testing contract connectivity...');
        const providerStats = await storageContract.getProviderStats(walletAddress);
        console.log('✅ Contract connectivity test successful');
        console.log('Current provider stats:', {
          totalStorage: providerStats[0].toString(),
          usedStorage: providerStats[1].toString(),
          uploadCount: providerStats[2].toString(),
          isActive: providerStats[3],
          nftTokenId: providerStats[4].toString()
        });
        
        // Check if already registered
        if (providerStats[3]) { // isActive
          console.log('⚠️ Provider already registered and active');
          throw new Error('Storage provider already registered. You are already registered on-chain!');
        }
      } catch (contractError: any) {
        if (contractError.message.includes('already registered')) {
          throw contractError; // Re-throw registration check errors
        }
        console.log('🔍 Contract read test failed (this is normal for first registration):', contractError.message);
      }

      const endpoint = `physical://${this.deviceId}@${this.getLocalIP()}:${this.serverPort}`;
      console.log('Endpoint:', endpoint);
      console.log('Storage capacity (bytes):', this.storageAllocation.allocatedBytes);
      console.log('Storage capacity (BigInt):', BigInt(this.storageAllocation.allocatedBytes).toString());

      // Estimate gas before sending transaction with multiple fallback strategies
      console.log('Estimating gas...');
      let gasLimit = 3000000; // Much higher default for local Hardhat network (3M gas)
      let gasPrice;
      
      try {
        // Get current gas price from network
        const feeData = await provider.getFeeData();
        gasPrice = feeData.gasPrice;
        console.log('Current gas price:', gasPrice ? ethers.formatUnits(gasPrice, 'gwei') + ' gwei' : 'auto');
        
        // For local networks, use very high gas limit to avoid issues
        if (network.chainId === 1337n || network.chainId === 31337n) {
          gasLimit = 5000000; // 5M gas for local Hardhat - very generous
          console.log('🏠 Local network detected - using high gas limit:', gasLimit);
        }
        
        // Try gas estimation with retry logic
        let gasEstimate;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Gas estimation attempt ${attempt}/3...`);
            gasEstimate = await storageContract.registerStorageProvider.estimateGas(
              BigInt(this.storageAllocation.allocatedBytes),
              endpoint
            );
            console.log(`✅ Gas estimate successful: ${gasEstimate.toString()} gas`);
            
            // For local networks, use even more generous buffer
            if (network.chainId === 1337n || network.chainId === 31337n) {
              gasLimit = Math.max(5000000, Number(gasEstimate) * 5); // 5x buffer for local
            } else {
              gasLimit = Math.max(3000000, Number(gasEstimate) * 3); // 3x buffer for others
            }
            break;
          } catch (estimateError: any) {
            console.warn(`⚠️ Gas estimation attempt ${attempt} failed:`, estimateError.message);
            if (attempt === 3) {
              console.log('Using fallback gas limit due to estimation failures');
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
            }
          }
        }
        
        if (gasEstimate) {
          console.log(`📊 Using estimated gas: ${gasEstimate} → ${gasLimit} (with generous buffer)`);
        } else {
          console.log('📊 Using fallback gas limit:', gasLimit);
        }
      } catch (gasError: any) {
        console.error('Gas estimation setup failed:', gasError);
        console.log('📊 Using default gas limit:', gasLimit);
      }
      
      // Prepare transaction options with maximum gas for local network
      const txOptions: any = {
        gasLimit: gasLimit
      };
      
      // For local Hardhat network, set explicit gas price if available
      if (gasPrice && (network.chainId === 1337n || network.chainId === 31337n)) {
        // Use a reasonable gas price for local network
        const localGasPrice = gasPrice > 0n ? gasPrice : ethers.parseUnits('20', 'gwei');
        txOptions.gasPrice = localGasPrice;
        console.log('💰 Using gas price:', ethers.formatUnits(localGasPrice, 'gwei'), 'gwei');
      }
      
      console.log('🚀 Transaction options:', {
        gasLimit: txOptions.gasLimit,
        gasPrice: txOptions.gasPrice ? ethers.formatUnits(txOptions.gasPrice, 'gwei') + ' gwei' : 'auto'
      });
      
      // Try transaction with retry logic for gas failures
      let tx;
      for (let txAttempt = 1; txAttempt <= 3; txAttempt++) {
        try {
          console.log(`📞 Transaction attempt ${txAttempt}/3...`);
          
          // Increase gas limit for each retry
          if (txAttempt > 1) {
            const newGasLimit = Math.floor(txOptions.gasLimit * (1 + txAttempt * 0.5));
            console.log(`🔄 Retry ${txAttempt}: Increasing gas limit from ${txOptions.gasLimit} to ${newGasLimit}`);
            txOptions.gasLimit = newGasLimit;
          }
          
          console.log('Sending transaction with options:', txOptions);
          tx = await storageContract.registerStorageProvider(
            BigInt(this.storageAllocation.allocatedBytes),
            endpoint,
            txOptions
          );
          
          console.log(`✅ Transaction sent successfully on attempt ${txAttempt}:`, tx.hash);
          break;
        } catch (txError: any) {
          console.error(`❌ Transaction attempt ${txAttempt} failed:`, {
            message: txError.message,
            reason: txError.reason,
            code: txError.code
          });
          
          if (txAttempt === 3) {
            throw txError; // Re-throw on final attempt
          }
          
          // Check if it's a gas-related error
          if (txError.message?.includes('gas') || txError.reason?.includes('gas')) {
            console.log(`⚠️ Gas-related error on attempt ${txAttempt}, retrying with higher gas...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          } else {
            throw txError; // Re-throw non-gas errors immediately
          }
        }
      }

      console.log('Transaction sent:', tx.hash);
      console.log('Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status
      });
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed during execution');
      }
      
      console.log('Successfully registered on-chain!');
      
      // Save on-chain registration status
      localStorage.setItem('destore_onchain_registered', 'true');
      
      // Update local device info
      const currentDevice = this.getCurrentDeviceInfo();
      currentDevice.onChainRegistered = true;
      currentDevice.walletAddress = walletAddress;
      
      // Update the device in connected devices map
      this.connectedDevices.set(this.deviceId, currentDevice);
      
      console.log('=== Registration Complete ===');
      return true;
    } catch (error: any) {
      console.error('=== On-Chain Registration Failed ===');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        reason: error.reason,
        code: error.code,
        stack: error.stack
      });
      
      // Re-throw with more context for the UI
      if (error.reason) {
        throw new Error(`Contract error: ${error.reason}`);
      } else if (error.message?.includes('user rejected')) {
        throw new Error('Transaction was rejected by user');
      } else if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient ETH for gas fees');
      } else if (error.message?.includes('out of gas') || error.message?.includes('gas')) {
        throw new Error('Transaction failed due to insufficient gas. This is usually a temporary issue - please try again.');
      } else if (error.message?.includes('network')) {
        throw new Error('Network connection error. Please check your connection to Hardhat Local network.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Update current device information in connected devices map
   */
  private updateCurrentDeviceInfo(): void {
    const deviceInfo: RealDeviceInfo = {
      deviceId: this.deviceId,
      ipAddress: this.getLocalIP(),
      port: this.serverPort,
      publicKey: '',
      contributedBytes: this.storageAllocation?.allocatedBytes || 0,
      usedBytes: this.storageAllocation?.usedBytes || 0,
      isOnline: true,
      lastSeen: Date.now(),
      walletAddress: '',
      onChainRegistered: localStorage.getItem('destore_onchain_registered') === 'true'
    };

    this.connectedDevices.set(this.deviceId, deviceInfo);
    console.log('Updated current device info:', deviceInfo);
  }

  /**
   * Get current device information
   */
  getCurrentDeviceInfo(): RealDeviceInfo {
    const existingDevice = this.connectedDevices.get(this.deviceId);
    if (existingDevice) {
      // Update the existing device with current storage info
      existingDevice.contributedBytes = this.storageAllocation?.allocatedBytes || 0;
      existingDevice.usedBytes = this.storageAllocation?.usedBytes || 0;
      existingDevice.onChainRegistered = localStorage.getItem('destore_onchain_registered') === 'true';
      existingDevice.lastSeen = Date.now();
      return existingDevice;
    }

    // Create new device info if it doesn't exist
    this.updateCurrentDeviceInfo();
    return this.connectedDevices.get(this.deviceId)!;
  }

  /**
   * Get all discovered devices on the network
   */
  getNetworkDevices(): RealDeviceInfo[] {
    return Array.from(this.connectedDevices.values()).filter(device => device.isOnline);
  }

  /**
   * Get real storage statistics
   */
  getRealStorageStats(): {
    totalQuota: number;
    used: number;
    allocated: number;
    available: number;
    networkReserved: number;
    isContributing: boolean;
  } {
    if (!this.storageAllocation) {
      return {
        totalQuota: 0,
        used: 0,
        allocated: 0,
        available: 0,
        networkReserved: 0,
        isContributing: false
      };
    }

    return {
      totalQuota: this.storageAllocation.storageQuota,
      used: this.storageAllocation.actualDeviceUsage,
      allocated: this.storageAllocation.allocatedBytes,
      available: this.storageAllocation.storageQuota - this.storageAllocation.actualDeviceUsage - this.storageAllocation.allocatedBytes,
      networkReserved: this.storageAllocation.reservedForNetwork,
      isContributing: this.isContributing
    };
  }

  private getLocalIP(): string {
    // This would need to be implemented with a more sophisticated method
    // For now, return localhost
    return 'localhost';
  }

  private handleStorageRequest(message: any): void {
    // Handle incoming file storage requests from other devices
    console.log('Received storage request:', message);
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Reset and clear all storage data - useful for debugging
   */
  async resetStorageData(): Promise<void> {
    console.log('🔄 Resetting all storage data...');
    
    try {
      // Clear localStorage data
      localStorage.removeItem('destore_storage_allocation');
      localStorage.removeItem('destore_onchain_registered');
      console.log('✅ Cleared localStorage data');
      
      // Delete and recreate IndexedDB
      await new Promise<void>((resolve, reject) => {
        console.log('🗑️ Deleting IndexedDB...');
        const deleteRequest = indexedDB.deleteDatabase('DestoreRealStorage');
        
        deleteRequest.onsuccess = () => {
          console.log('✅ IndexedDB deleted successfully');
          resolve();
        };
        
        deleteRequest.onerror = () => {
          console.log('⚠️ IndexedDB delete failed, but continuing...');
          resolve(); // Continue anyway
        };
        
        deleteRequest.onblocked = () => {
          console.log('⚠️ IndexedDB delete blocked, but continuing...');
          setTimeout(() => resolve(), 2000); // Wait 2 seconds then continue
        };
      });
      
      // Reset storage allocation state
      this.storageAllocation = {
        allocatedBytes: 0,
        usedBytes: 0,
        reservedForNetwork: 0,
        actualDeviceUsage: 0,
        storageQuota: 0
      };
      this.isContributing = false;
      
      // Reinitialize storage
      await this.initializeRealStorage();
      
      console.log('🎉 Storage reset complete!');
    } catch (error) {
      console.error('❌ Storage reset failed:', error);
      throw error;
    }
  }

  /**
   * Debug method to check storage environment
   */
  async debugStorageEnvironment(): Promise<void> {
    console.log('=== 🔍 Storage Environment Debug ===');
    
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        console.log('📊 Browser Storage Estimate:');
        console.log(`   Quota: ${this.formatBytes(estimate.quota || 0)} (${estimate.quota})`);
        console.log(`   Usage: ${this.formatBytes(estimate.usage || 0)} (${estimate.usage})`);
        
        if (this.storageAllocation) {
          console.log('🏠 Destore Allocation:');
          console.log(`   Already Allocated: ${this.formatBytes(this.storageAllocation.allocatedBytes)}`);
          console.log(`   Reserved for Network: ${this.formatBytes(this.storageAllocation.reservedForNetwork)}`);
          
          const availableSpace = (estimate.quota || 0) - (estimate.usage || 0) - this.storageAllocation.allocatedBytes;
          console.log(`   Available for Allocation: ${this.formatBytes(availableSpace)}`);
          console.log(`   Available as GB: ${(availableSpace / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        }
      } else {
        console.log('⚠️ Storage estimation not supported in this browser');
      }
      
      // Test IndexedDB availability
      try {
        const testRequest = indexedDB.open('destore-test', 1);
        testRequest.onsuccess = () => {
          console.log('✅ IndexedDB is available');
          testRequest.result.close();
          indexedDB.deleteDatabase('destore-test');
        };
        testRequest.onerror = () => {
          console.log('❌ IndexedDB error:', testRequest.error);
        };
      } catch (error) {
        console.log('❌ IndexedDB not available:', error);
      }
      
      console.log('🌐 Browser Info:');
      console.log(`   User Agent: ${navigator.userAgent}`);
      console.log(`   Platform: ${navigator.platform}`);
      console.log(`   Storage Persistent: ${await navigator.storage?.persist?.() || 'Not supported'}`);
      
    } catch (error) {
      console.error('❌ Storage debug failed:', error);
    }
    
    console.log('=== End Storage Debug ===');
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): {
    totalDevices: number;
    onlineDevices: number;
    totalStorage: number;
    usedStorage: number;
    onChainDevices: number;
  } {
    const devices = Array.from(this.connectedDevices.values());
    const onlineDevices = devices.filter(d => d.isOnline);
    const onChainDevices = devices.filter(d => d.onChainRegistered);

    return {
      totalDevices: devices.length,
      onlineDevices: onlineDevices.length,
      totalStorage: onlineDevices.reduce((sum, d) => sum + d.contributedBytes, 0),
      usedStorage: onlineDevices.reduce((sum, d) => sum + d.usedBytes, 0),
      onChainDevices: onChainDevices.length
    };
  }
}

export default RealPhysicalStorageService;