import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Monitor, HardDrive, Wifi, FileText, Users } from 'lucide-react';
import PhysicalStorageService from '../services/PhysicalStorageService';

export default function PhysicalStorageDemo() {
  const [devices, setDevices] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [storedFiles, setStoredFiles] = useState<any[]>([]);

  const physicalStorageService = PhysicalStorageService.getInstance();

  useEffect(() => {
    loadNetworkData();
    const interval = setInterval(loadNetworkData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNetworkData = () => {
    // Get discovered devices
    const discoveredDevices = physicalStorageService.discoverStorageDevices();
    setDevices(discoveredDevices);

    // Get stored files
    const files = physicalStorageService.getStoredFiles();
    setStoredFiles(files);

    // Calculate network stats
    const totalContributed = discoveredDevices.reduce((sum, device) => sum + device.contributedBytes, 0);
    const totalUsed = discoveredDevices.reduce((sum, device) => sum + (device.contributedBytes - device.availableBytes), 0);
    const totalFiles = discoveredDevices.reduce((sum, device) => sum + device.files.size, 0);

    setNetworkStats({
      totalDevices: discoveredDevices.length,
      totalContributed,
      totalUsed,
      totalFiles
    });
  };

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const getDeviceStatus = (device: any): { color: string; label: string } => {
    const timeSinceLastSeen = Date.now() - device.lastSeen;
    if (timeSinceLastSeen < 60000) return { color: 'green', label: 'Online' };
    if (timeSinceLastSeen < 300000) return { color: 'yellow', label: 'Away' };
    return { color: 'red', label: 'Offline' };
  };

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Physical Storage Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {networkStats?.totalDevices || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {networkStats ? formatBytes(networkStats.totalContributed) : '0 GB'}
              </div>
              <div className="text-sm text-muted-foreground">Total Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {networkStats ? formatBytes(networkStats.totalUsed) : '0 GB'}
              </div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {networkStats?.totalFiles || 0}
              </div>
              <div className="text-sm text-muted-foreground">Files Stored</div>
            </div>
          </div>

          {networkStats && networkStats.totalContributed > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Network Storage Usage</span>
                <span>{((networkStats.totalUsed / networkStats.totalContributed) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(networkStats.totalUsed / networkStats.totalContributed) * 100} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Storage Devices ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {devices.map((device, index) => {
              const status = getDeviceStatus(device);
              const usagePercent = ((device.contributedBytes - device.availableBytes) / device.contributedBytes) * 100;
              
              return (
                <div key={device.deviceId} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    <div>
                      <div className="font-medium">
                        {device.deviceId === physicalStorageService.getDeviceStats().deviceId 
                          ? 'Your Device' 
                          : `Device ${index + 1}`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {device.deviceId}
                      </div>
                    </div>
                  </div>

                  <Badge 
                    variant={status.color === 'green' ? 'default' : 'secondary'}
                    className={`${status.color === 'green' ? 'bg-green-500' : status.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
                  >
                    {status.label}
                  </Badge>

                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage: {formatBytes(device.contributedBytes)}</span>
                      <span>{usagePercent.toFixed(1)}% used</span>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-medium">{device.files.size}</div>
                    <div className="text-xs text-muted-foreground">Files</div>
                  </div>
                </div>
              );
            })}

            {devices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>No storage devices discovered.</p>
                <p className="text-sm">Contribute storage to join the network!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files Stored Locally */}
      {storedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Files Stored on Your Device ({storedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {storedFiles.map((file) => (
                <div key={file.fileId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{file.fileName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatBytes(file.fileSize)} • {file.chunkIds.length} chunks
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Uploaded by</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {file.uploadedBy.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}