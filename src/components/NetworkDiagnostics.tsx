import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ethers } from 'ethers';
import { CheckCircle, XCircle, AlertCircle, Loader2, Wifi, Zap } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export function NetworkDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (name: string, updates: Partial<DiagnosticResult>) => {
    setResults(prev => prev.map(r => r.name === name ? { ...r, ...updates } : r));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Direct RPC Connection
    addResult({ name: 'Direct RPC Connection', status: 'loading', message: 'Testing...' });
    try {
      const response = await fetch('http://127.0.0.1:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      });
      
      const rpcResult = await response.json();
      const chainId = parseInt(rpcResult.result, 16);
      
      updateResult('Direct RPC Connection', {
        status: 'success',
        message: `Connected successfully - Chain ID: ${chainId}`,
        details: `RPC URL: http://127.0.0.1:8545`
      });
    } catch (error: any) {
      updateResult('Direct RPC Connection', {
        status: 'error',
        message: 'Failed to connect to Hardhat node',
        details: `Error: ${error.message}`
      });
    }

    // Test 2: MetaMask Provider
    addResult({ name: 'MetaMask Provider', status: 'loading', message: 'Testing...' });
    try {
      if (!(window as any).ethereum) {
        updateResult('MetaMask Provider', {
          status: 'error',
          message: 'MetaMask not installed',
          details: 'Please install MetaMask browser extension'
        });
      } else {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const network = await provider.getNetwork();
        
        if (network.chainId === 1337n) {
          updateResult('MetaMask Provider', {
            status: 'success',
            message: `Connected to Hardhat Local (Chain ID: ${network.chainId})`,
            details: `Network: ${network.name}`
          });
        } else {
          updateResult('MetaMask Provider', {
            status: 'warning',
            message: `Wrong network - Chain ID: ${network.chainId}`,
            details: 'Please switch to Hardhat Local Network'
          });
        }
      }
    } catch (error: any) {
      updateResult('MetaMask Provider', {
        status: 'error',
        message: 'MetaMask connection failed',
        details: error.message
      });
    }

    // Test 3: Environment Variables
    addResult({ name: 'Environment Configuration', status: 'loading', message: 'Testing...' });
    const requiredEnvVars = [
      'VITE_STORAGE_NETWORK_ADDRESS',
      'VITE_DESTORE_TOKEN_ADDRESS',
      'VITE_CHAIN_ID',
      'VITE_RPC_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length === 0) {
      updateResult('Environment Configuration', {
        status: 'success',
        message: 'All environment variables configured',
        details: `Chain ID: ${import.meta.env.VITE_CHAIN_ID}, RPC: ${import.meta.env.VITE_RPC_URL}`
      });
    } else {
      updateResult('Environment Configuration', {
        status: 'error',
        message: `Missing environment variables: ${missingVars.join(', ')}`,
        details: 'Check your .env.local file'
      });
    }

    // Test 4: Contract Connectivity
    addResult({ name: 'Smart Contract', status: 'loading', message: 'Testing...' });
    try {
      const STORAGE_NETWORK_ADDRESS = import.meta.env.VITE_STORAGE_NETWORK_ADDRESS;
      
      if (!STORAGE_NETWORK_ADDRESS) {
        updateResult('Smart Contract', {
          status: 'error',
          message: 'Contract address not configured',
          details: 'VITE_STORAGE_NETWORK_ADDRESS missing in environment'
        });
      } else {
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const code = await provider.getCode(STORAGE_NETWORK_ADDRESS);
        
        if (code === '0x') {
          updateResult('Smart Contract', {
            status: 'error',
            message: 'Contract not found at address',
            details: `Address: ${STORAGE_NETWORK_ADDRESS}`
          });
        } else {
          updateResult('Smart Contract', {
            status: 'success',
            message: 'Contract verified and deployed',
            details: `Address: ${STORAGE_NETWORK_ADDRESS}, Bytecode: ${code.length} chars`
          });
        }
      }
    } catch (error: any) {
      updateResult('Smart Contract', {
        status: 'error',
        message: 'Contract verification failed',
        details: error.message
      });
    }

    // Test 5: Account Balance
    addResult({ name: 'Account Balance', status: 'loading', message: 'Testing...' });
    try {
      if ((window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length === 0) {
          updateResult('Account Balance', {
            status: 'warning',
            message: 'No accounts connected',
            details: 'Please connect your MetaMask wallet'
          });
        } else {
          const balance = await provider.getBalance(accounts[0].address);
          const balanceInEth = ethers.formatEther(balance);
          
          updateResult('Account Balance', {
            status: 'success',
            message: `Account connected with ${parseFloat(balanceInEth).toFixed(4)} ETH`,
            details: `Address: ${accounts[0].address}`
          });
        }
      }
    } catch (error: any) {
      updateResult('Account Balance', {
        status: 'error',
        message: 'Failed to check account balance',
        details: error.message
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'loading':
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Network Diagnostics
        </CardTitle>
        <CardDescription>
          Test blockchain connectivity and configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">System Health Check</h3>
            <p className="text-sm text-muted-foreground">
              Verify Hardhat node, MetaMask connection, and smart contracts
            </p>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Test Results:</h4>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">{result.name}</h5>
                      <Badge variant="outline" className="text-xs">
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-500 mt-2 font-mono">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isRunning && results.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Quick Setup Guide:</h4>
            <div className="text-xs space-y-1 text-gray-600">
              <p>• Hardhat node should be running on http://127.0.0.1:8545</p>
              <p>• MetaMask network: Hardhat Local, Chain ID: 1337, RPC: http://127.0.0.1:8545</p>
              <p>• Import test account: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</p>
              <p>• Contracts deployed and environment variables configured</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NetworkDiagnostics;