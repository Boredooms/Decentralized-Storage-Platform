import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePinata } from '@/hooks/use-pinata';
import { 
  File, 
  Download, 
  ExternalLink, 
  Eye, 
  Calendar, 
  HardDrive,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface FileViewerProps {
  ipfsHash: string;
  metadataHash?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadTime?: number;
  className?: string;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  ipfsHash,
  metadataHash,
  fileName,
  fileSize,
  fileType,
  uploadTime,
  className = '',
}) => {
  const { 
    getGatewayUrl, 
    getAlternativeUrls, 
    downloadFile, 
    checkFileExists,
    getFileInfo,
    loading 
  } = usePinata();
  
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  const [fileInfo, setFileInfo] = useState<{ size: number; type: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const checkFile = async () => {
      try {
        const exists = await checkFileExists(ipfsHash);
        setFileExists(exists);
        
        if (exists) {
          const info = await getFileInfo(ipfsHash);
          setFileInfo(info);
        }
      } catch (error) {
        console.error('Error checking file:', error);
        setFileExists(false);
      }
    };

    checkFile();
  }, [ipfsHash, checkFileExists, getFileInfo]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadFile(ipfsHash, fileName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `file-${ipfsHash.slice(0, 8)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Download failed', {
        description: 'Unable to download file from IPFS',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(ipfsHash);
    setCopied(true);
    toast.success('IPFS hash copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewFile = () => {
    window.open(getGatewayUrl(ipfsHash), '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('text')) return '📝';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  };

  const displayFileName = fileName || `file-${ipfsHash.slice(0, 8)}`;
  const displayFileSize = fileSize || fileInfo?.size || 0;
  const displayFileType = fileType || fileInfo?.type || 'Unknown';

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {getFileIcon(displayFileType)}
            </div>
            <div>
              <CardTitle className="text-lg">{displayFileName}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{formatFileSize(displayFileSize)}</span>
                <span>•</span>
                <span>{displayFileType}</span>
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {fileExists === true && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Available
              </Badge>
            )}
            {fileExists === false && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Unavailable
              </Badge>
            )}
            {fileExists === null && loading && (
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Checking
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              <span>IPFS Hash:</span>
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded break-all">
              {ipfsHash}
            </div>
          </div>
          
          {metadataHash && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <File className="h-4 w-4" />
                <span>Metadata Hash:</span>
              </div>
              <div className="font-mono text-xs bg-muted p-2 rounded break-all">
                {metadataHash}
              </div>
            </div>
          )}
        </div>

        {/* Upload Time */}
        {uploadTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Uploaded: {formatDate(uploadTime)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleViewFile}
            disabled={fileExists === false}
            variant="outline"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            View File
          </Button>
          
          <Button
            onClick={handleDownload}
            disabled={fileExists === false || isDownloading}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
          
          <Button
            onClick={handleCopyHash}
            variant="ghost"
            size="sm"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Hash
              </>
            )}
          </Button>
        </div>

        {/* Alternative Gateways */}
        {fileExists === true && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Alternative Gateways:
            </div>
            <div className="flex flex-wrap gap-2">
              {getAlternativeUrls(ipfsHash).map((url, index) => (
                <Button
                  key={index}
                  onClick={() => window.open(url, '_blank')}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Gateway {index + 1}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


