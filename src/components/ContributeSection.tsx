import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Gift, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Coins,
  HardDrive
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ContributeSectionProps = { donation?: any; contributors?: any[] };

export function ContributeSection(_props: ContributeSectionProps) {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data - replace with blockchain interactions
  const myDonation = null;
  const topContributors: any[] = [];
  
  const donateStorageMutation = async (data: any) => {
    // This will be replaced with smart contract interaction
    console.log('Donating storage:', data);
  };
  
  const accrueRewardsMutation = async (data: any) => {
    // This will be replaced with smart contract interaction
    console.log('Accruing rewards:', data);
    return { newTokenBalance: 100 };
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not found. Please install MetaMask to continue.", {
        action: {
          label: "Install",
          onClick: () => window.open("https://metamask.io/download/", "_blank"),
        },
      });
      return;
    }

    setIsConnecting(true);
    try {
      const provider = window.ethereum;
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (Array.isArray(accounts) && accounts.length > 0) {
        setWalletAddress(String(accounts[0]));
        toast.success("Wallet connected successfully!");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePledgeSubmit = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amountGB = parseFloat(pledgeAmount);
    if (!amountGB || amountGB <= 0) {
      toast.error("Please enter a valid storage amount");
      return;
    }

    const pledgedCapacity = amountGB * 1024 * 1024 * 1024; // Convert GB to bytes

    setIsSubmitting(true);
    try {
      await donateStorageMutation({
        pledgedCapacity,
        wallet: walletAddress,
      });
      
      toast.success(`Successfully pledged ${amountGB} GB of storage!`);
      setPledgeAmount("");
    } catch (error) {
      console.error("Pledge error:", error);
      toast.error("Failed to submit pledge. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      const result = await accrueRewardsMutation({ amount: 10 });
      toast.success(`Claimed 10 demo tokens! New balance: ${result.newTokenBalance}`);
    } catch (error) {
      console.error("Claim error:", error);
      toast.error("Failed to claim rewards. Please try again.");
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contribute Storage</h2>
        <p className="text-muted-foreground mt-2">
          Donate your storage capacity to the network and earn demo tokens as rewards.
        </p>
      </div>

      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to participate in storage donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!walletAddress ? (
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="w-full sm:w-auto"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect MetaMask
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{shortenAddress(walletAddress)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyAddress(walletAddress)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Pledge */}
      {walletAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Pledge Storage
            </CardTitle>
            <CardDescription>
              Commit storage capacity to earn rewards (Demo mode)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storage-amount">Storage Amount (GB)</Label>
                <Input
                  id="storage-amount"
                  type="number"
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(e.target.value)}
                  placeholder="Enter storage amount in GB"
                  min="0.1"
                  step="0.1"
                />
              </div>
              
              <Button 
                onClick={handlePledgeSubmit}
                disabled={isSubmitting || !pledgeAmount}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Pledge Storage
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Rewards */}
      {walletAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              Demo Rewards
            </CardTitle>
            <CardDescription>
              Claim demo tokens for testing purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleClaimRewards}
              className="w-full"
            >
              <Gift className="w-4 h-4 mr-2" />
              Claim 10 Demo Tokens
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}