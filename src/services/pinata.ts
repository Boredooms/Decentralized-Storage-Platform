import { PINATA_CONFIG, PINATA_METADATA_TEMPLATE } from '@/config/pinata';

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface PinataMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    file: {
      name: string;
      type: string;
      size: number;
      hash: string;
    };
    storage: {
      provider: string;
      network: string;
      redundancy: number;
    };
  };
}

export interface FileUploadOptions {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  pinataMetadata?: {
    name?: string;
    keyvalues?: Record<string, string>;
  };
  pinataOptions?: {
    cidVersion?: number;
    wrapWithDirectory?: boolean;
  };
}

class PinataService {
  private apiKey: string;
  private secretKey: string;
  private gatewayUrl: string;

  constructor() {
    this.apiKey = PINATA_CONFIG.API_KEY;
    this.secretKey = PINATA_CONFIG.SECRET_KEY;
    this.gatewayUrl = PINATA_CONFIG.GATEWAY_URL;

    if (!this.apiKey || !this.secretKey) {
      console.info('ℹ️ Pinata API keys not configured. File uploads will work in demo mode.');
    }
  }

  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(file: File, options: FileUploadOptions): Promise<PinataUploadResponse> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add metadata
      const metadata = {
        name: options.name,
        keyvalues: {
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size.toString(),
          uploadDate: new Date().toISOString(),
          ...options.metadata,
        },
        ...options.pinataMetadata,
      };

      formData.append('pinataMetadata', JSON.stringify(metadata));

      // Add options
      const pinataOptions = {
        cidVersion: 1,
        wrapWithDirectory: false,
        ...options.pinataOptions,
      };

      formData.append('pinataOptions', JSON.stringify(pinataOptions));

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Pinata upload failed: ${errorData.error?.details || response.statusText}`);
      }

      const result: PinataUploadResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      throw error;
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(metadata: PinataMetadata, options: FileUploadOptions): Promise<PinataUploadResponse> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: options.name || 'metadata.json',
            keyvalues: {
              type: 'metadata',
              ...options.metadata,
            },
            ...options.pinataMetadata,
          },
          pinataOptions: {
            cidVersion: 1,
            ...options.pinataOptions,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Pinata metadata upload failed: ${errorData.error?.details || response.statusText}`);
      }

      const result: PinataUploadResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading metadata to Pinata:', error);
      throw error;
    }
  }

  /**
   * Create metadata for a file upload
   */
  createFileMetadata(
    file: File,
    ipfsHash: string,
    options: FileUploadOptions
  ): PinataMetadata {
    return {
      ...PINATA_METADATA_TEMPLATE,
      name: options.name || file.name,
      description: options.description || `Decentralized storage of ${file.name}`,
      image: this.getGatewayUrl(ipfsHash),
      external_url: this.getGatewayUrl(ipfsHash),
      attributes: [
        {
          trait_type: 'File Type',
          value: file.type || 'Unknown',
        },
        {
          trait_type: 'File Size',
          value: `${(file.size / 1024).toFixed(2)} KB`,
        },
        {
          trait_type: 'Storage Provider',
          value: 'Pinata',
        },
        {
          trait_type: 'Network',
          value: 'IPFS',
        },
      ],
      properties: {
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          hash: ipfsHash,
        },
        storage: {
          provider: 'Pinata',
          network: 'IPFS',
          redundancy: 1,
        },
      },
    };
  }

  /**
   * Get the full IPFS URL for a hash
   */
  getGatewayUrl(hash: string): string {
    return `${this.gatewayUrl}${hash}`;
  }

  /**
   * Get alternative gateway URLs for redundancy
   */
  getAlternativeUrls(hash: string): string[] {
    return [
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`,
    ];
  }

  /**
   * Check if a file exists on IPFS
   */
  async checkFileExists(hash: string): Promise<boolean> {
    try {
      const response = await fetch(this.getGatewayUrl(hash), {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Get file information from IPFS
   */
  async getFileInfo(hash: string): Promise<{ size: number; type: string } | null> {
    try {
      const response = await fetch(this.getGatewayUrl(hash), {
        method: 'HEAD',
      });

      if (!response.ok) {
        return null;
      }

      return {
        size: parseInt(response.headers.get('content-length') || '0'),
        type: response.headers.get('content-type') || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  /**
   * Download a file from IPFS
   */
  async downloadFile(hash: string, filename?: string): Promise<Blob> {
    try {
      const response = await fetch(this.getGatewayUrl(hash));
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Pin a file to Pinata (ensure it stays available)
   */
  async pinFile(hash: string, name?: string): Promise<boolean> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
        body: JSON.stringify({
          hashToPin: hash,
          pinataMetadata: {
            name: name || `pinned-${hash}`,
            keyvalues: {
              pinnedAt: new Date().toISOString(),
            },
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error pinning file:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const pinataService = new PinataService();
export default pinataService;


