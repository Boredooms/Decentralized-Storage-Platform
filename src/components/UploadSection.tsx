import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Upload, File, X, CheckCircle, AlertCircle, Wallet, HardDrive, Cloud, ExternalLink, Database } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Web3Connect } from "./Web3Connect";
import { FileUpload } from "./FileUpload";
import ContributeStorage from "./ContributeStorage";
import PhysicalStorageDemo from "./PhysicalStorageDemo";
import RealStorageContribution from "./RealStorageContribution";
import { pinataService } from "@/services/pinata";
import { useSupabase } from "@/hooks/use-supabase";
import { useWeb3 } from "@/hooks/use-web3";
import { useNetworkAnalytics } from "@/hooks/use-network-analytics";
import StorageNetworkService from "@/services/StorageNetworkService";
import PhysicalStorageService from "@/services/PhysicalStorageService";
import RealPhysicalStorageService from "@/services/RealPhysicalStorageService";

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  ipfsHash?: string;
  uploadType?: "traditional" | "web3" | "contribute";
}

export function UploadSection() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [activeTab, setActiveTab] = useState<"web3" | "traditional" | "contribute">("traditional");
  const { saveFileRecord } = useSupabase();
  const { isConnected, account } = useWeb3();
  const { recordTransfer } = useNetworkAnalytics();
  
  const storageService = StorageNetworkService.getInstance();
  const physicalStorageService = PhysicalStorageService.getInstance();
  const realStorageService = RealPhysicalStorageService.getInstance();
  
  const uploadFileMutation = async (data: any) => {
    // This will be replaced with smart contract interaction
    console.log('Uploading file:', data);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
      uploadType: activeTab
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, [activeTab]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB max file size
  });

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFileToPinata = async (uploadFile: UploadFile) => {
    const startTime = Date.now();
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f
      ));

      // Simulate progress for better UX
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 20 } : f
      ));

      const result = await pinataService.uploadFile(uploadFile.file, {
        name: uploadFile.file.name,
        description: `Uploaded via DeStore on ${new Date().toISOString()}`
      });

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 80 } : f
      ));

      // Save to Supabase database
      try {
        await saveFileRecord({
          file_name: uploadFile.file.name,
          file_size: uploadFile.file.size,
          file_type: uploadFile.file.type,
          ipfs_hash: result.IpfsHash,
          upload_type: 'traditional'
        });
      } catch (dbError) {
        console.warn('Failed to save to database:', dbError);
        // Continue anyway - file is uploaded to IPFS
      }

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: "success", 
          progress: 100,
          ipfsHash: result.IpfsHash
        } : f
      ));

      // Record successful transfer for analytics
      const duration = Date.now() - startTime;
      recordTransfer(true, uploadFile.file.size, duration);

      toast.success(`${uploadFile.file.name} uploaded to IPFS successfully!`, {
        description: `IPFS Hash: ${result.IpfsHash}`,
      });

    } catch (error) {
      console.error("Pinata upload error:", error);
      
      // Record failed transfer for analytics
      const duration = Date.now() - startTime;
      recordTransfer(false, uploadFile.file.size, duration);
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: "error", 
          error: error instanceof Error ? error.message : "Upload failed"
        } : f
      ));
      toast.error(`Failed to upload ${uploadFile.file.name} to IPFS`);
    }
  };

  const uploadFileToPhysicalNetwork = async (uploadFile: UploadFile) => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f
      ));

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 10 } : f
      ));

      // Distribute file across physical storage devices
      const result = await physicalStorageService.distributeFile(
        uploadFile.file, 
        account || 'anonymous'
      );

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 50 } : f
      ));

      // Also upload to IPFS for backup/accessibility
      const ipfsResult = await pinataService.uploadFile(uploadFile.file, {
        name: uploadFile.file.name,
        description: `Distributed storage backup - File ID: ${result.fileId}`
      });

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 80 } : f
      ));

      // Save to database
      try {
        await saveFileRecord({
          file_name: uploadFile.file.name,
          file_size: uploadFile.file.size,
          file_type: uploadFile.file.type,
          ipfs_hash: ipfsResult.IpfsHash,
          upload_type: 'web3' // Mark as distributed storage
        });
      } catch (dbError) {
        console.warn('Failed to save to database:', dbError);
      }

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: "success", 
          progress: 100,
          ipfsHash: result.fileId
        } : f
      ));

      toast.success(`${uploadFile.file.name} distributed across ${result.devices.length} physical devices!`, {
        description: `File ID: ${result.fileId}, Chunks: ${result.chunks.length}`,
      });

    } catch (error) {
      console.error("Physical storage upload error:", error);
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: "error", 
          error: error instanceof Error ? error.message : "Upload failed"
        } : f
      ));
      toast.error(`Failed to distribute ${uploadFile.file.name} to physical storage network`);
    }
  };
  const uploadFileToWeb3 = async (uploadFile: UploadFile) => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f
      ));

      // Simulate file processing and chunking
      const chunks = [];
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(uploadFile.file.size / chunkSize);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, uploadFile.file.size);
        const chunkData = uploadFile.file.slice(start, end);
        
        // Simulate chunk hash generation
        const chunkHash = `chunk_${uploadFile.id}_${i}_${Date.now()}`;
        
        // Simulate peer selection (would be real peer IDs in production)
        const peerIds = [`peer_${Math.random().toString(36).substr(2, 8)}`, 
                        `peer_${Math.random().toString(36).substr(2, 8)}`,
                        `peer_${Math.random().toString(36).substr(2, 8)}`];
        
        chunks.push({
          hash: chunkHash,
          size: chunkData.size,
          peerIds
        });

        // Update progress
        const progress = ((i + 1) / totalChunks) * 80; // 80% for chunking
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress } : f
        ));

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Simulate manifest creation and blockchain submission
      const manifestHash = `manifest_${uploadFile.id}_${Date.now()}`;
      const encryptionKey = `key_${Math.random().toString(36).substr(2, 16)}`;

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 90 } : f
      ));

      // Submit to blockchain
      await uploadFileMutation({
        name: uploadFile.file.name,
        size: uploadFile.file.size,
        mimeType: uploadFile.file.type,
        manifestHash,
        encryptionKey,
        chunks,
        redundancyFactor: 3,
      });

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 100, status: "success" } : f
      ));

      toast.success(`${uploadFile.file.name} uploaded to decentralized network successfully`);

    } catch (error) {
      console.error("Web3 upload error:", error);
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: "error", 
          error: error instanceof Error ? error.message : "Upload failed"
        } : f
      ));
      toast.error(`Failed to upload ${uploadFile.file.name} to decentralized network`);
    }
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    if (uploadFile.uploadType === "traditional") {
      await uploadFileToPinata(uploadFile);
    } else {
      // Use physical storage for web3 uploads
      await uploadFileToPhysicalNetwork(uploadFile);
    }
  };

  const uploadAll = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === "pending");
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "uploading":
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Files</h2>
        <p className="text-muted-foreground mt-2">
          Upload files to the decentralized storage network using physical device storage with automatic encryption and redundancy.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "web3" | "traditional" | "contribute")} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="web3" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Physical Storage (NFT)
          </TabsTrigger>
          <TabsTrigger value="traditional" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Traditional Upload (IPFS)
          </TabsTrigger>
          <TabsTrigger value="contribute" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Contribute Storage
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="web3" className="space-y-6">
          <Web3Connect />
          <FileUpload 
            key={`${isConnected}-${account}`} 
            onUploadSuccess={(tokenId, txHash) => {
              toast.success('File uploaded as NFT!', {
                description: `Token ID: ${tokenId}`,
              });
            }} 
          />
        </TabsContent>
        
        <TabsContent value="traditional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                IPFS Storage via Pinata
              </CardTitle>
              <CardDescription>
                Upload files to IPFS (InterPlanetary File System) for decentralized storage.
                Drag and drop files or click to browse. Maximum file size: 100MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop files here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Drop files here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      Files will be uploaded to IPFS via Pinata
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {uploadFiles.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upload Queue</CardTitle>
                  <CardDescription>
                    {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''} ready for upload
                  </CardDescription>
                </div>
                <Button 
                  onClick={uploadAll}
                  disabled={uploadFiles.every(f => f.status !== "pending")}
                >
                  Upload All to IPFS
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadFiles.map((uploadFile) => (
                    <motion.div
                      key={uploadFile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      {getStatusIcon(uploadFile.status)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{uploadFile.file.name}</p>
                          <span className="text-sm text-muted-foreground">
                            {formatBytes(uploadFile.file.size)}
                          </span>
                        </div>
                        
                        {uploadFile.status === "uploading" && (
                          <div className="space-y-1">
                            <Progress value={uploadFile.progress} className="h-1" />
                            <p className="text-xs text-muted-foreground">
                              {uploadFile.progress.toFixed(0)}% complete - Uploading to IPFS
                            </p>
                          </div>
                        )}
                        
                        {uploadFile.status === "error" && uploadFile.error && (
                          <p className="text-xs text-red-500">{uploadFile.error}</p>
                        )}
                        
                        {uploadFile.status === "success" && (
                          <div className="space-y-1">
                            <p className="text-xs text-green-600">Upload complete - Available on IPFS</p>
                            {uploadFile.ipfsHash && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${uploadFile.ipfsHash}`, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View on IPFS
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {uploadFile.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="contribute" className="space-y-6">
          <RealStorageContribution />
        </TabsContent>
      </Tabs>
    </div>
  );
}