import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Download, 
  Trash2, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileText,
  MoreHorizontal,
  Copy,
  Share,
  ExternalLink,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useSupabase, FileRecord } from "@/hooks/use-supabase";
import NetworkAnalyticsService, { RealTimeNetworkStats } from "@/services/NetworkAnalyticsService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilesSectionProps {
  // Remove the files prop since we'll load from Supabase
}

export function FilesSection({}: FilesSectionProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkStats, setNetworkStats] = useState<RealTimeNetworkStats | null>(null);
  const { getUserFiles, deleteFileRecord } = useSupabase();
  const analyticsService = NetworkAnalyticsService.getInstance();

  useEffect(() => {
    loadFiles();
    
    // Get initial network stats
    setNetworkStats(analyticsService.getCurrentStats());
    
    // Set up real-time updates every 3 seconds
    const interval = setInterval(() => {
      const newStats = analyticsService.getCurrentStats();
      setNetworkStats(newStats);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const userFiles = await getUserFiles();
      setFiles(userFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) 
      return <Archive className="w-5 h-5" />;
    if (mimeType.includes('text') || mimeType.includes('document')) 
      return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getStatusColor = () => {
    // All files from Supabase are considered 'stored'
    return 'bg-green-100 text-green-800 border-green-200';
  };
  const handleDelete = async (fileId: string, fileName: string) => {
    try {
      await deleteFileRecord(fileId);
      toast.success(`${fileName} deleted successfully`);
      // Reload files after deletion
      await loadFiles();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${fileName}`);
    }
  };

  const handleDownload = async (file: FileRecord) => {
    // Open IPFS gateway URL
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${file.ipfs_hash}`;
    window.open(ipfsUrl, '_blank');
    toast.info(`Opening ${file.file_name} from IPFS`);
  };

  const handleCopyHash = (ipfsHash: string) => {
    navigator.clipboard.writeText(ipfsHash);
    toast.success("IPFS hash copied to clipboard");
  };

  const handleShare = (file: FileRecord) => {
    const shareUrl = `https://gateway.pinata.cloud/ipfs/${file.ipfs_hash}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("IPFS link copied to clipboard");
  };

  if (files.length === 0) {
    return (
      <div className="space-y-8">
        {/* Network Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Files Stored
            </CardTitle>
            <CardDescription>
              Real-time file statistics across the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {networkStats?.totalFiles || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total files in network
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  0
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Your files
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {networkStats?.totalDeals || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Active deals
                </div>
              </div>
            </div>
            {networkStats && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Last updated: {new Date(networkStats.lastUpdated).toLocaleTimeString()}</span>
                  <span>Network health: {networkStats.networkHealth}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Files</h2>
          <p className="text-muted-foreground mt-2">
            Your uploaded files will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <File className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Upload your first file to get started with decentralized storage.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Network Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            Files Stored
          </CardTitle>
          <CardDescription>
            Real-time file statistics across the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {networkStats?.totalFiles || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total files in network
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {files.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Your files
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {networkStats?.totalDeals || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Active deals
              </div>
            </div>
          </div>
          {networkStats && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Last updated: {new Date(networkStats.lastUpdated).toLocaleTimeString()}</span>
                <span>Network health: {networkStats.networkHealth}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Files</h2>
          <p className="text-muted-foreground mt-2">
            {files.length} file{files.length !== 1 ? 's' : ''} stored in the network
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Total size: {formatBytes(files.reduce((sum, f) => sum + f.file_size, 0))}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading files...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 text-muted-foreground">
                      {getFileIcon(file.file_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold truncate">{file.file_name}</h3>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor()}
                        >
                          {file.upload_type === 'traditional' ? 'IPFS' : 'NFT'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>{formatBytes(file.file_size)}</span>
                        <span>{formatDate(file.created_at)}</span>
                        <span>IPFS Hash</span>
                        {file.token_id && <span>Token #{file.token_id}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on IPFS
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopyHash(file.ipfs_hash)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy IPFS Hash
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(file)}>
                            <Share className="w-4 h-4 mr-2" />
                            Share IPFS Link
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(file.id, file.file_name)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
