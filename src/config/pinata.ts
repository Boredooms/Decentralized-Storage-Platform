// Pinata configuration
export const PINATA_CONFIG = {
  // These will be loaded from environment variables
  API_KEY: import.meta.env.VITE_PINATA_API_KEY || '',
  SECRET_KEY: import.meta.env.VITE_PINATA_SECRET_KEY || '',
  GATEWAY_URL: 'https://gateway.pinata.cloud/ipfs/',
  JWT: import.meta.env.VITE_PINATA_JWT || '', // Optional: JWT for authentication
};

export const PINATA_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
];

export const PINATA_METADATA_TEMPLATE = {
  name: '',
  description: '',
  image: '',
  external_url: '',
  attributes: [],
  properties: {
    file: {
      name: '',
      type: '',
      size: 0,
      hash: '',
    },
    storage: {
      provider: 'Pinata',
      network: 'IPFS',
      redundancy: 1,
    },
  },
};


