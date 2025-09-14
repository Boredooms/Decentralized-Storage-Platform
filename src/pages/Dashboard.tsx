import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { useUser, useAuth } from '@clerk/clerk-react';
import { motion } from "framer-motion";
import { 
  Upload, 
  Download, 
  Files, 
  Network, 
  Settings, 
  LogOut,
  HardDrive,
  Users,
  Activity,
  Shield,
  Copy
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { UploadSection } from "@/components/UploadSection";
import { FilesSection } from "@/components/FilesSection";
import { NetworkSection } from "@/components/NetworkSection";
import { NetworkDiagnostics } from "@/components/NetworkDiagnostics";
// import NetworkAnalyticsService from "@/services/NetworkAnalyticsService";
import { toast } from "sonner";

type ActiveSection = "upload" | "files" | "network" | "settings";

export default function Dashboard() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActiveSection>("upload");
  
  // Initialize analytics service
  // const analyticsService = NetworkAnalyticsService.getInstance();
  
  // Get real-time network stats instead of mock data
  const [networkStats, setNetworkStats] = useState<any>(null);
  
  useEffect(() => {
    // Temporary: Analytics service disabled due to import issues
    // Get initial stats
    // const stats = analyticsService.getCurrentStats();
    setNetworkStats({
      networkHealth: 85,
      totalPeers: 1,
      activePeers: 1,
      totalStorage: 0,
      totalFiles: 0,
      totalDeals: 0,
      averageRetrievalTime: 3.2,
      redundancyFactor: 3.0
    });
    
    // Update stats every 3 seconds
    // const interval = setInterval(() => {
    //   const newStats = analyticsService.getCurrentStats();
    //   setNetworkStats({
    //     networkHealth: newStats.networkHealth,
    //     totalPeers: newStats.onlineDevices,
    //     activePeers: newStats.activePeers,
    //     totalStorage: newStats.totalStorage,
    //     totalFiles: newStats.totalFiles,
    //     totalDeals: newStats.totalDeals,
    //     averageRetrievalTime: newStats.averageRetrievalTime,
    //     redundancyFactor: newStats.distribution.redundancyLevel
    //   });
    // }, 3000);
    
    // return () => clearInterval(interval);
  }, []);
  
  const userFiles: any[] = [];
  const myDonation = null;
  const topContributors: any[] = [];

  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    // Default to upload if contribute tab is accessed
    if (tab && tab !== 'contribute') {
      setActiveSection(tab as ActiveSection);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Mock storage data since Clerk user doesn't have these properties
  const storageUsed = 0;
  const storageQuota = 1024 * 1024 * 1024; // 1GB default
  const storagePercentage = (storageUsed / storageQuota) * 100;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderContent = () => {
    switch (activeSection) {
      case "upload":
        return <UploadSection />;
      case "files":
        return <FilesSection />;
      case "network":
        return <NetworkSection stats={networkStats} />;
      case "settings":
        return <NetworkDiagnostics />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">DeStore</h1>
                <p className="text-xs text-muted-foreground">Decentralized Storage</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "upload"}
                  onClick={() => setActiveSection("upload")}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "files"}
                  onClick={() => setActiveSection("files")}
                >
                  <Files className="w-4 h-4" />
                  <span>My Files</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "network"}
                  onClick={() => setActiveSection("network")}
                >
                  <Network className="w-4 h-4" />
                  <span>Network</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "settings"}
                  onClick={() => setActiveSection("settings")}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="space-y-4">
              {networkStats && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Network Health</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        networkStats.networkHealth > 80 ? 'bg-green-500' :
                        networkStats.networkHealth > 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{networkStats.networkHealth}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span>{networkStats.activePeers} peers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Files className="w-3 h-3 text-muted-foreground" />
                      <span>{networkStats.totalFiles} files</span>
                    </div>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User'}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="w-full justify-start h-8 px-2"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>DeStore</span>
                <span>/</span>
                <span className="text-foreground capitalize">{activeSection}</span>
              </nav>
            </header>
            
            <main className="flex-1 p-6">
              {renderContent()}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}