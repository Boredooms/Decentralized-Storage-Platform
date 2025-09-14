import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/hooks/use-web3';
import { Wallet, LogOut, RefreshCw } from 'lucide-react';

export const Web3Connect: React.FC = () => {
  const {
    isConnected,
    account,
    chainId,
    error,
    connect,
    disconnect,
    getBalance,
  } = useWeb3();

  const [balance, setBalance] = React.useState<string>('0');
  const [loading, setLoading] = React.useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connect();
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleGetBalance = async () => {
    try {
      const bal = await getBalance();
      setBalance(parseFloat(bal).toFixed(4));
    } catch (err) {
      console.error('Failed to get balance:', err);
    }
  };

  React.useEffect(() => {
    if (isConnected) {
      handleGetBalance();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to interact with the decentralized storage network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleConnect} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </>
            )}
          </Button>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Account:</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Chain ID:</span>
            <Badge variant="outline">
              {chainId}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Balance:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{balance} ETH</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGetBalance}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        {chainId !== 1337 && chainId !== 1 && chainId !== 11155111 && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            Please switch to a supported network (Localhost, Mainnet, or Sepolia)
          </div>
        )}
      </CardContent>
    </Card>
  );
};


