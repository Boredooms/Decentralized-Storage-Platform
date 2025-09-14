import RealPhysicalStorageService from './RealPhysicalStorageService';
import { pinataService } from './pinata';

export interface NetworkPerformanceMetrics {
  avgUploadSpeed: number; // MB/s
  avgDownloadSpeed: number; // MB/s
  networkLatency: number; // ms
  successRate: number; // percentage
  totalTransfers: number;
  failedTransfers: number;
}

export interface StorageDistributionMetrics {
  replicationFactor: number;
  chunkSize: number; // bytes
  erasureCoding: string;
  activeDeals: number;
  redundancyLevel: number;
}

export interface RealTimeNetworkStats {
  // Core Network Stats
  totalFiles: number;
  totalStorage: number; // bytes
  activePeers: number;
  totalDeals: number;
  averageRetrievalTime: number; // seconds
  networkHealth: number; // percentage 0-100
  
  // Performance Metrics
  performance: NetworkPerformanceMetrics;
  
  // Storage Distribution
  distribution: StorageDistributionMetrics;
  
  // Real-time Data
  onlineDevices: number;
  onChainDevices: number;
  usedStorage: number;
  lastUpdated: number;
}

class NetworkAnalyticsService {
  private static instance: NetworkAnalyticsService;
  private realStorageService: RealPhysicalStorageService;
  private performanceHistory: Array<{ timestamp: number; uploadSpeed: number; downloadSpeed: number; latency: number }> = [];
  private transferHistory: Array<{ timestamp: number; success: boolean; size: number; duration: number }> = [];
  private currentStats: RealTimeNetworkStats;
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.realStorageService = RealPhysicalStorageService.getInstance();
    this.currentStats = this.initializeStats();
    this.startRealTimeUpdates();
  }

  static getInstance(): NetworkAnalyticsService {
    if (!NetworkAnalyticsService.instance) {
      NetworkAnalyticsService.instance = new NetworkAnalyticsService();
    }
    return NetworkAnalyticsService.instance;
  }

  private initializeStats(): RealTimeNetworkStats {
    return {
      totalFiles: 0,
      totalStorage: 0,
      activePeers: 0,
      totalDeals: 0,
      averageRetrievalTime: 0,
      networkHealth: 0,
      performance: {
        avgUploadSpeed: 0,
        avgDownloadSpeed: 0,
        networkLatency: 0,
        successRate: 100,
        totalTransfers: 0,
        failedTransfers: 0
      },
      distribution: {
        replicationFactor: 3,
        chunkSize: 1024 * 1024, // 1MB
        erasureCoding: 'Reed-Solomon',
        activeDeals: 0,
        redundancyLevel: 3.2
      },
      onlineDevices: 0,
      onChainDevices: 0,
      usedStorage: 0,
      lastUpdated: Date.now()
    };
  }

  private startRealTimeUpdates(): void {
    // Update every 3 seconds
    this.updateInterval = setInterval(() => {
      this.updateNetworkStats();
    }, 3000);

    // Initial update
    this.updateNetworkStats();
  }

  private async updateNetworkStats(): Promise<void> {
    try {
      // Get real network data from RealPhysicalStorageService
      const networkStats = this.realStorageService.getNetworkStats();
      const networkDevices = this.realStorageService.getNetworkDevices();

      // Calculate total files from all devices
      const totalFiles = await this.calculateTotalFiles();
      
      // Update performance metrics
      await this.updatePerformanceMetrics();
      
      // Calculate network health
      const networkHealth = this.calculateNetworkHealth(networkStats, networkDevices);

      // Update current stats
      this.currentStats = {
        totalFiles,
        totalStorage: networkStats.totalStorage,
        activePeers: networkStats.onlineDevices,
        totalDeals: this.calculateActiveDeals(networkDevices),
        averageRetrievalTime: this.calculateAverageRetrievalTime(),
        networkHealth,
        performance: this.currentStats.performance,
        distribution: {
          ...this.currentStats.distribution,
          activeDeals: this.calculateActiveDeals(networkDevices)
        },
        onlineDevices: networkStats.onlineDevices,
        onChainDevices: networkStats.onChainDevices,
        usedStorage: networkStats.usedStorage,
        lastUpdated: Date.now()
      };

      console.log('Network stats updated:', this.currentStats);
    } catch (error) {
      console.error('Failed to update network stats:', error);
    }
  }

  private async calculateTotalFiles(): Promise<number> {
    try {
      // Get files from IndexedDB (local storage)
      const fileCount = await this.getStoredFilesCount();
      
      // Add simulated network files based on device activity
      const networkDevices = this.realStorageService.getNetworkDevices();
      const networkFiles = networkDevices.reduce((sum, device) => {
        // Estimate files based on used storage (average file size ~10MB)
        return sum + Math.floor(device.usedBytes / (10 * 1024 * 1024));
      }, 0);

      return fileCount + networkFiles;
    } catch (error) {
      console.error('Failed to calculate total files:', error);
      return 0;
    }
  }

  private async getStoredFilesCount(): Promise<number> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('DestoreRealStorage', 1);
        
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('network_files')) {
            resolve(0);
            return;
          }
          
          const transaction = db.transaction(['network_files'], 'readonly');
          const store = transaction.objectStore('network_files');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            resolve(countRequest.result);
          };
          
          countRequest.onerror = () => {
            resolve(0);
          };
        };
        
        request.onerror = () => {
          resolve(0);
        };
      } catch (error) {
        resolve(0);
      }
    });
  }

  private async updatePerformanceMetrics(): Promise<void> {
    // Simulate real-time performance measurements
    const now = Date.now();
    
    // Generate realistic performance data based on network activity
    const networkDevices = this.realStorageService.getNetworkDevices();
    const deviceCount = networkDevices.length;
    
    // Base performance increases with more devices (network effect)
    const baseUploadSpeed = Math.min(20, 5 + (deviceCount * 2.5)); // MB/s
    const baseDownloadSpeed = Math.min(25, 8 + (deviceCount * 2.8)); // MB/s
    const baseLatency = Math.max(20, 80 - (deviceCount * 5)); // ms
    
    // Add some realistic variance
    const uploadSpeed = baseUploadSpeed + (Math.random() - 0.5) * 4;
    const downloadSpeed = baseDownloadSpeed + (Math.random() - 0.5) * 5;
    const latency = baseLatency + (Math.random() - 0.5) * 20;
    
    // Store performance history (keep last 60 samples for 3-minute window)
    this.performanceHistory.push({
      timestamp: now,
      uploadSpeed: Math.max(0.1, uploadSpeed),
      downloadSpeed: Math.max(0.1, downloadSpeed),
      latency: Math.max(10, latency)
    });
    
    // Keep only recent history
    this.performanceHistory = this.performanceHistory.slice(-60);
    
    // Calculate averages
    const avgUploadSpeed = this.performanceHistory.reduce((sum, p) => sum + p.uploadSpeed, 0) / this.performanceHistory.length;
    const avgDownloadSpeed = this.performanceHistory.reduce((sum, p) => sum + p.downloadSpeed, 0) / this.performanceHistory.length;
    const avgLatency = this.performanceHistory.reduce((sum, p) => sum + p.latency, 0) / this.performanceHistory.length;
    
    // Calculate success rate based on network health
    const successRate = Math.max(95, 100 - (100 - this.currentStats.networkHealth) * 0.5);
    
    this.currentStats.performance = {
      avgUploadSpeed: Math.round(avgUploadSpeed * 10) / 10,
      avgDownloadSpeed: Math.round(avgDownloadSpeed * 10) / 10,
      networkLatency: Math.round(avgLatency),
      successRate: Math.round(successRate * 10) / 10,
      totalTransfers: this.transferHistory.length,
      failedTransfers: this.transferHistory.filter(t => !t.success).length
    };
  }

  private calculateNetworkHealth(
    networkStats: any, 
    networkDevices: any[]
  ): number {
    let healthScore = 0;
    let totalFactors = 0;

    // Factor 1: Device availability (25% weight)
    const deviceAvailability = networkStats.onlineDevices / Math.max(1, networkStats.totalDevices);
    healthScore += deviceAvailability * 25;
    totalFactors += 25;

    // Factor 2: Storage utilization (20% weight)
    const storageUtilization = networkStats.totalStorage > 0 ? 
      Math.min(1, networkStats.usedStorage / networkStats.totalStorage) : 0;
    const optimalUtilization = Math.abs(0.7 - storageUtilization); // 70% is optimal
    healthScore += Math.max(0, 1 - optimalUtilization) * 20;
    totalFactors += 20;

    // Factor 3: Network performance (25% weight)
    const performanceScore = Math.min(1, 
      (this.currentStats.performance.successRate / 100) * 
      Math.min(1, this.currentStats.performance.avgDownloadSpeed / 20)
    );
    healthScore += performanceScore * 25;
    totalFactors += 25;

    // Factor 4: On-chain verification (15% weight)
    const verificationRate = networkStats.totalDevices > 0 ? 
      networkStats.onChainDevices / networkStats.totalDevices : 0;
    healthScore += verificationRate * 15;
    totalFactors += 15;

    // Factor 5: Network latency (15% weight)
    const latencyScore = Math.max(0, 1 - (this.currentStats.performance.networkLatency - 20) / 100);
    healthScore += Math.max(0, latencyScore) * 15;
    totalFactors += 15;

    return Math.min(100, Math.max(0, Math.round(healthScore)));
  }

  private calculateActiveDeals(networkDevices: any[]): number {
    // Calculate active storage deals based on device activity
    return networkDevices.reduce((sum, device) => {
      if (device.isOnline && device.contributedBytes > 0) {
        // Estimate deals based on contributed storage (1 deal per GB)
        return sum + Math.floor(device.contributedBytes / (1024 * 1024 * 1024));
      }
      return sum;
    }, 0);
  }

  private calculateAverageRetrievalTime(): number {
    // Calculate based on network performance and device count
    const deviceCount = this.currentStats.onlineDevices;
    const baseRetrievalTime = 3.0; // Base 3 seconds
    
    // More devices = faster retrieval due to redundancy
    const deviceBonus = Math.min(2.0, deviceCount * 0.1);
    
    // Network performance impact
    const performanceBonus = (this.currentStats.performance.avgDownloadSpeed - 10) * 0.05;
    
    // Latency impact
    const latencyPenalty = (this.currentStats.performance.networkLatency - 30) * 0.01;
    
    const retrievalTime = Math.max(0.5, baseRetrievalTime - deviceBonus - performanceBonus + latencyPenalty);
    
    return Math.round(retrievalTime * 10) / 10;
  }

  // Public method to record a file transfer for analytics
  recordTransfer(success: boolean, sizeBytes: number, durationMs: number): void {
    this.transferHistory.push({
      timestamp: Date.now(),
      success,
      size: sizeBytes,
      duration: durationMs
    });

    // Keep only recent transfers (last 100)
    this.transferHistory = this.transferHistory.slice(-100);
  }

  // Public method to get current stats
  getCurrentStats(): RealTimeNetworkStats {
    return { ...this.currentStats };
  }

  // Public method to get performance history for charts
  getPerformanceHistory(): Array<{ timestamp: number; uploadSpeed: number; downloadSpeed: number; latency: number }> {
    return [...this.performanceHistory];
  }

  // Clean up
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export default NetworkAnalyticsService;