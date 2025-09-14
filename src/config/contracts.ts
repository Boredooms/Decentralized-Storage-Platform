// Contract addresses and configuration
export const CONTRACT_ADDRESSES = {
  // These will be populated after deployment
  STORAGE_NFT: import.meta.env.VITE_STORAGE_NFT_ADDRESS || '',
  MARKETPLACE: import.meta.env.VITE_MARKETPLACE_ADDRESS || '',
};

export const NETWORK_CONFIG = {
  CHAIN_ID: parseInt(import.meta.env.VITE_CHAIN_ID || '1337'),
  RPC_URL: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545',
  BLOCK_EXPLORER: import.meta.env.VITE_BLOCK_EXPLORER || '',
};

export const SUPPORTED_CHAINS = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-key',
    blockExplorer: 'https://etherscan.io',
  },
  11155111: {
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/your-key',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  1337: {
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
  },
};


