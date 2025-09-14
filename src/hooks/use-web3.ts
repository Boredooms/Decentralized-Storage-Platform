import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

interface Web3State {
  isConnected: boolean;
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  error: string | null;
}

interface Web3Actions {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
  getBalance: () => Promise<string>;
}

export const useWeb3 = (): Web3State & Web3Actions => {
  const [state, setState] = useState<Web3State>({
    isConnected: false,
    account: null,
    provider: null,
    signer: null,
    chainId: null,
    error: null,
  });

  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const provider = await detectEthereumProvider();
      if (!provider) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }

      const ethereumProvider = new ethers.BrowserProvider(provider as any);
      const accounts = await ethereumProvider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const signer = await ethereumProvider.getSigner();
      const network = await ethereumProvider.getNetwork();

      setState({
        isConnected: true,
        account: accounts[0],
        provider: ethereumProvider,
        signer,
        chainId: Number(network.chainId),
        error: null,
      });

      // Listen for account changes
      provider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setState(prev => ({
            ...prev,
            isConnected: false,
            account: null,
            signer: null,
          }));
        } else {
          setState(prev => ({
            ...prev,
            account: accounts[0],
          }));
        }
      });

      // Listen for chain changes
      provider.on('chainChanged', (chainId: string) => {
        setState(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16),
        }));
      });

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      account: null,
      provider: null,
      signer: null,
      chainId: null,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (chainId: string) => {
    if (!state.provider) {
      throw new Error('Provider not connected');
    }

    try {
      await state.provider.send('wallet_switchEthereumChain', [
        { chainId },
      ]);
    } catch (error: any) {
      // If the chain doesn't exist, add it
      if (error.code === 4902) {
        await state.provider.send('wallet_addEthereumChain', [
          {
            chainId,
            chainName: 'Localhost',
            rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: null,
          },
        ]);
      } else {
        throw error;
      }
    }
  }, [state.provider]);

  const getBalance = useCallback(async (): Promise<string> => {
    if (!state.provider || !state.account) {
      throw new Error('Provider or account not connected');
    }

    const balance = await state.provider.getBalance(state.account);
    return ethers.formatEther(balance);
  }, [state.provider, state.account]);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const provider = await detectEthereumProvider();
        if (provider) {
          const ethereumProvider = new ethers.BrowserProvider(provider as any);
          const accounts = await ethereumProvider.send('eth_accounts', []);
          
          if (accounts.length > 0) {
            const signer = await ethereumProvider.getSigner();
            const network = await ethereumProvider.getNetwork();
            
            setState({
              isConnected: true,
              account: accounts[0],
              provider: ethereumProvider,
              signer,
              chainId: Number(network.chainId),
              error: null,
            });
          }
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    };

    checkConnection();
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    getBalance,
  };
};


