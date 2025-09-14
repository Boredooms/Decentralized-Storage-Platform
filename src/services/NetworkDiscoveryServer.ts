// Simple network discovery using WebRTC or WebSocket signaling
// This would be implemented with a real P2P discovery mechanism in production

export interface DiscoveryMessage {
  type: 'announce' | 'response' | 'ping' | 'pong';
  deviceId: string;
  endpoint: string;
  storageInfo: {
    allocated: number;
    used: number;
    available: number;
  };
  walletAddress?: string;
  onChainRegistered: boolean;
  timestamp: number;
}

class NetworkDiscoveryServer {
  private static instance: NetworkDiscoveryServer;
  private isRunning: boolean = false;
  private discoveredPeers: Map<string, any> = new Map();
  private broadcastChannel: BroadcastChannel;
  private deviceId: string;

  private constructor() {
    this.deviceId = this.getDeviceId();
    this.broadcastChannel = new BroadcastChannel('destore-discovery');
    this.setupMessageHandling();
  }

  static getInstance(): NetworkDiscoveryServer {
    if (!NetworkDiscoveryServer.instance) {
      NetworkDiscoveryServer.instance = new NetworkDiscoveryServer();
    }
    return NetworkDiscoveryServer.instance;
  }

  private getDeviceId(): string {
    return localStorage.getItem('destore_real_device_id') || 'unknown';
  }

  private setupMessageHandling(): void {
    this.broadcastChannel.onmessage = (event) => {
      const message: DiscoveryMessage = event.data;
      this.handleDiscoveryMessage(message);
    };

    // Also listen for storage events from the same origin
    window.addEventListener('storage', (event) => {
      if (event.key === 'destore-peer-discovery') {
        try {
          const message = JSON.parse(event.newValue || '{}');
          this.handleDiscoveryMessage(message);
        } catch (error) {
          console.error('Failed to parse storage event:', error);
        }
      }
    });
  }

  startDiscovery(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Starting network discovery...');

    // Announce our presence
    this.announcePresence();

    // Set up periodic announcements
    setInterval(() => {
      this.announcePresence();
      this.cleanupOldPeers();
    }, 10000); // Every 10 seconds

    // Try to discover peers using different methods
    this.discoverPeersViaBroadcast();
    this.discoverPeersViaLocalStorage();
  }

  private announcePresence(): void {
    const message: DiscoveryMessage = {
      type: 'announce',
      deviceId: this.deviceId,
      endpoint: `localhost:${window.location.port || 3000}`,
      storageInfo: {
        allocated: this.getStorageInfo().allocated,
        used: this.getStorageInfo().used,
        available: this.getStorageInfo().available
      },
      onChainRegistered: this.getOnChainStatus(),
      timestamp: Date.now()
    };

    // Broadcast via BroadcastChannel (same origin)
    this.broadcastChannel.postMessage(message);

    // Also save to localStorage for cross-tab discovery
    localStorage.setItem('destore-peer-discovery', JSON.stringify(message));

    console.log('Announced presence:', message);
  }

  private discoverPeersViaBroadcast(): void {
    // Send ping to discover other devices
    const pingMessage: DiscoveryMessage = {
      type: 'ping',
      deviceId: this.deviceId,
      endpoint: `localhost:${window.location.port || 3000}`,
      storageInfo: this.getStorageInfo(),
      onChainRegistered: this.getOnChainStatus(),
      timestamp: Date.now()
    };

    this.broadcastChannel.postMessage(pingMessage);
  }

  private discoverPeersViaLocalStorage(): void {
    // Check if there are other devices announced in localStorage
    try {
      const storedMessage = localStorage.getItem('destore-peer-discovery');
      if (storedMessage) {
        const message = JSON.parse(storedMessage);
        if (message.deviceId !== this.deviceId) {
          this.handleDiscoveryMessage(message);
        }
      }
    } catch (error) {
      console.error('Failed to discover peers via localStorage:', error);
    }
  }

  private handleDiscoveryMessage(message: DiscoveryMessage): void {
    if (message.deviceId === this.deviceId) return; // Ignore our own messages

    console.log('Received discovery message:', message);

    switch (message.type) {
      case 'announce':
      case 'ping':
        this.addDiscoveredPeer(message);
        if (message.type === 'ping') {
          this.respondToPing(message);
        }
        break;
      case 'response':
      case 'pong':
        this.addDiscoveredPeer(message);
        break;
    }
  }

  private addDiscoveredPeer(message: DiscoveryMessage): void {
    const peer = {
      deviceId: message.deviceId,
      endpoint: message.endpoint,
      storageInfo: message.storageInfo,
      walletAddress: message.walletAddress,
      onChainRegistered: message.onChainRegistered,
      lastSeen: message.timestamp,
      isOnline: true
    };

    this.discoveredPeers.set(message.deviceId, peer);
    console.log(`Discovered peer: ${message.deviceId} at ${message.endpoint}`);
  }

  private respondToPing(pingMessage: DiscoveryMessage): void {
    const response: DiscoveryMessage = {
      type: 'pong',
      deviceId: this.deviceId,
      endpoint: `localhost:${window.location.port || 3000}`,
      storageInfo: this.getStorageInfo(),
      onChainRegistered: this.getOnChainStatus(),
      timestamp: Date.now()
    };

    this.broadcastChannel.postMessage(response);
  }

  private cleanupOldPeers(): void {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    this.discoveredPeers.forEach((peer, deviceId) => {
      if (now - peer.lastSeen > timeout) {
        peer.isOnline = false;
        console.log(`Peer ${deviceId} marked as offline`);
      }
    });
  }

  private getStorageInfo(): { allocated: number; used: number; available: number } {
    // This would integrate with RealPhysicalStorageService
    const allocation = localStorage.getItem('destore_storage_allocation');
    if (allocation) {
      const data = JSON.parse(allocation);
      return {
        allocated: data.allocatedBytes || 0,
        used: 0, // Would be calculated from actual usage
        available: data.allocatedBytes || 0
      };
    }
    return { allocated: 0, used: 0, available: 0 };
  }

  private getOnChainStatus(): boolean {
    // Check if this device is registered on-chain
    return localStorage.getItem('destore_onchain_registered') === 'true';
  }

  getDiscoveredPeers(): any[] {
    return Array.from(this.discoveredPeers.values());
  }

  getPeerCount(): number {
    return Array.from(this.discoveredPeers.values()).filter(p => p.isOnline).length;
  }

  getTotalNetworkStorage(): number {
    return Array.from(this.discoveredPeers.values())
      .filter(p => p.isOnline)
      .reduce((total, peer) => total + peer.storageInfo.allocated, 0);
  }

  stopDiscovery(): void {
    this.isRunning = false;
    this.broadcastChannel.close();
  }
}

export default NetworkDiscoveryServer;