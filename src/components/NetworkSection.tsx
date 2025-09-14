import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Users, 
  HardDrive, 
  Activity, 
  Shield, 
  Globe,
  Zap,
  Database,
  Network,
  Clock,
  TrendingUp,
  Wifi
} from "lucide-react";
import NetworkAnalyticsService, { RealTimeNetworkStats } from "@/services/NetworkAnalyticsService";

interface NetworkSectionProps {
  stats?: {
    totalFiles: number;
    totalStorage: number;
    activePeers: number;
    totalDeals: number;
    averageRetrievalTime: number;
    networkHealth: number;
  } | null;
}

export function NetworkSection({ stats: legacyStats }: NetworkSectionProps) {
  const [realTimeStats, setRealTimeStats] = useState<RealTimeNetworkStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const analyticsService = NetworkAnalyticsService.getInstance();

  useEffect(() => {
    // Get initial stats
    setRealTimeStats(analyticsService.getCurrentStats());
    setLastUpdate(new Date().toLocaleTimeString());

    // Set up real-time updates every 3 seconds
    const interval = setInterval(() => {
      const newStats = analyticsService.getCurrentStats();
      setRealTimeStats(newStats);
      setLastUpdate(new Date().toLocaleTimeString());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Use real-time stats if available, fallback to legacy stats
  const stats = realTimeStats || legacyStats;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeColor = (health: number) => {
    if (health >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (health >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (!stats) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Network Status</h2>
          <p className="text-muted-foreground mt-2">
            Initializing real-time network analytics...
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded mb-4" />
                  <div className="w-16 h-4 bg-muted rounded mb-2" />
                  <div className="w-24 h-6 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4 animate-spin" />
            <span>Connecting to network analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  const networkMetrics = [
    {
      title: "Active Peers",
      value: realTimeStats ? realTimeStats.onlineDevices.toLocaleString() : stats.activePeers.toLocaleString(),
      icon: Users,
      description: "Nodes contributing storage",
      color: "text-blue-600",
      change: realTimeStats ? `${realTimeStats.onChainDevices} verified` : undefined
    },
    {
      title: "Total Storage",
      value: formatBytes(stats.totalStorage),
      icon: HardDrive,
      description: "Data stored across network",
      color: "text-purple-600",
      change: realTimeStats ? `${formatBytes(realTimeStats.usedStorage)} used` : undefined
    },
    {
      title: "Files Stored",
      value: stats.totalFiles.toLocaleString(),
      icon: Database,
      description: "Total files in network",
      color: "text-green-600",
      change: realTimeStats ? `${realTimeStats.totalDeals} deals` : undefined
    },
    {
      title: "Avg Retrieval",
      value: `${stats.averageRetrievalTime}s`,
      icon: Zap,
      description: "Average download time",
      color: "text-orange-600",
      change: realTimeStats ? `${realTimeStats.performance.successRate}% success` : undefined
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Network Status</h2>
          <p className="text-muted-foreground mt-2">
            Real-time statistics of the decentralized storage network
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Updated {lastUpdate}
          </Badge>
          <Badge variant="outline" className={getHealthBadgeColor(stats.networkHealth)}>
            <Activity className="w-3 h-3 mr-1" />
            {stats.networkHealth}% Health
          </Badge>
        </div>
      </div>

      {/* Network Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Network Health
          </CardTitle>
          <CardDescription>
            Overall network performance and reliability metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network Health Score</span>
              <span className={`text-2xl font-bold ${getHealthColor(stats.networkHealth)}`}>
                {stats.networkHealth}%
              </span>
            </div>
            <Progress value={stats.networkHealth} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-green-600">Excellent</div>
                <div className="text-muted-foreground">80-100%</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">Good</div>
                <div className="text-muted-foreground">60-79%</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">Poor</div>
                <div className="text-muted-foreground">0-59%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {networkMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <metric.icon className={`w-8 h-8 ${metric.color}`} />
                  {realTimeStats && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                    {metric.change && (
                      <p className="text-xs text-green-600 font-medium">{metric.change}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Network Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Storage Distribution
            </CardTitle>
            <CardDescription>
              How data is distributed across the network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Replication Factor</span>
                <Badge variant="outline">
                  {realTimeStats ? `${realTimeStats.distribution.replicationFactor}x` : '3x'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Chunk Size</span>
                <span className="text-sm font-medium">
                  {realTimeStats ? formatBytes(realTimeStats.distribution.chunkSize) : '1 MB'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Erasure Coding</span>
                <Badge variant="outline">
                  {realTimeStats ? realTimeStats.distribution.erasureCoding : 'Reed-Solomon'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Deals</span>
                <span className="text-sm font-medium">
                  {realTimeStats ? realTimeStats.distribution.activeDeals.toLocaleString() : stats.totalDeals.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Redundancy Level</span>
                <span className="text-sm font-medium text-green-600">
                  {realTimeStats ? `${realTimeStats.distribution.redundancyLevel}x` : '3.2x'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Network Performance
            </CardTitle>
            <CardDescription>
              Real-time performance metrics
              {realTimeStats && (
                <Badge variant="outline" className="ml-2">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Upload Speed</span>
                <span className="text-sm font-medium">
                  {realTimeStats ? `${realTimeStats.performance.avgUploadSpeed} MB/s` : '15.2 MB/s'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Download Speed</span>
                <span className="text-sm font-medium">
                  {realTimeStats ? `${realTimeStats.performance.avgDownloadSpeed} MB/s` : '18.7 MB/s'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Network Latency</span>
                <span className="text-sm font-medium">
                  {realTimeStats ? `${realTimeStats.performance.networkLatency}ms` : '45ms'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Success Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {realTimeStats ? `${realTimeStats.performance.successRate}%` : '99.8%'}
                </span>
              </div>
              {realTimeStats && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Total Transfers</span>
                    <span>{realTimeStats.performance.totalTransfers}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Failed Transfers</span>
                    <span className="text-red-500">{realTimeStats.performance.failedTransfers}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
