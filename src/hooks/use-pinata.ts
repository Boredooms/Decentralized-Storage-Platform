import { useState, useCallback } from 'react';
import { pinataService, PinataUploadResponse, PinataMetadata, FileUploadOptions } from '@/services/pinata';
import { toast } from 'sonner';

export interface UsePinataReturn {
  uploadFile: (file: File, options: FileUploadOptions) => Promise<PinataUploadResponse>;
  uploadMetadata: (metadata: PinataMetadata, options: FileUploadOptions) => Promise<PinataUploadResponse>;
  createFileMetadata: (file: File, ipfsHash: string, options: FileUploadOptions) => PinataMetadata;
  downloadFile: (hash: string, filename?: string) => Promise<Blob>;
  checkFileExists: (hash: string) => Promise<boolean>;
  getFileInfo: (hash: string) => Promise<{ size: number; type: string } | null>;
  pinFile: (hash: string, name?: string) => Promise<boolean>;
  getGatewayUrl: (hash: string) => string;
  getAlternativeUrls: (hash: string) => string[];
  loading: boolean;
  error: string | null;
}

export const usePinata = (): UsePinataReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any, operation: string) => {
    const errorMessage = err instanceof Error ? err.message : `Failed to ${operation}`;
    setError(errorMessage);
    toast.error(`Pinata ${operation} failed`, {
      description: errorMessage,
    });
    console.error(`Pinata ${operation} error:`, err);
  }, []);

  const uploadFile = useCallback(async (file: File, options: FileUploadOptions): Promise<PinataUploadResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await pinataService.uploadFile(file, options);
      toast.success('File uploaded to IPFS', {
        description: `Hash: ${result.IpfsHash}`,
      });
      return result;
    } catch (err) {
      handleError(err, 'file upload');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const uploadMetadata = useCallback(async (metadata: PinataMetadata, options: FileUploadOptions): Promise<PinataUploadResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await pinataService.uploadMetadata(metadata, options);
      toast.success('Metadata uploaded to IPFS', {
        description: `Hash: ${result.IpfsHash}`,
      });
      return result;
    } catch (err) {
      handleError(err, 'metadata upload');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createFileMetadata = useCallback((file: File, ipfsHash: string, options: FileUploadOptions): PinataMetadata => {
    return pinataService.createFileMetadata(file, ipfsHash, options);
  }, []);

  const downloadFile = useCallback(async (hash: string, filename?: string): Promise<Blob> => {
    setLoading(true);
    setError(null);

    try {
      const blob = await pinataService.downloadFile(hash, filename);
      toast.success('File downloaded from IPFS', {
        description: filename || `Hash: ${hash}`,
      });
      return blob;
    } catch (err) {
      handleError(err, 'file download');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const checkFileExists = useCallback(async (hash: string): Promise<boolean> => {
    try {
      return await pinataService.checkFileExists(hash);
    } catch (err) {
      handleError(err, 'file existence check');
      return false;
    }
  }, [handleError]);

  const getFileInfo = useCallback(async (hash: string): Promise<{ size: number; type: string } | null> => {
    try {
      return await pinataService.getFileInfo(hash);
    } catch (err) {
      handleError(err, 'file info retrieval');
      return null;
    }
  }, [handleError]);

  const pinFile = useCallback(async (hash: string, name?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = await pinataService.pinFile(hash, name);
      if (success) {
        toast.success('File pinned to Pinata', {
          description: `Hash: ${hash}`,
        });
      } else {
        toast.error('Failed to pin file to Pinata');
      }
      return success;
    } catch (err) {
      handleError(err, 'file pinning');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getGatewayUrl = useCallback((hash: string): string => {
    return pinataService.getGatewayUrl(hash);
  }, []);

  const getAlternativeUrls = useCallback((hash: string): string[] => {
    return pinataService.getAlternativeUrls(hash);
  }, []);

  return {
    uploadFile,
    uploadMetadata,
    createFileMetadata,
    downloadFile,
    checkFileExists,
    getFileInfo,
    pinFile,
    getGatewayUrl,
    getAlternativeUrls,
    loading,
    error,
  };
};


