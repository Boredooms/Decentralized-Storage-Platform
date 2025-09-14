# 🌐 DeStore - Decentralized Storage Network

> A revolutionary decentralized storage platform that combines Web3 technology with real physical storage contribution, enabling users to store files securely across a global network of peers while earning DESTORE tokens.

[![Built with React](https://img.shields.io/badge/Built%20with-React%2019-61DAFB.svg)](https://react.dev/)
[![Powered by Ethereum](https://img.shields.io/badge/Powered%20by-Ethereum-627EEA.svg)](https://ethereum.org/)
[![IPFS Storage](https://img.shields.io/badge/Storage-IPFS-65C2CB.svg)](https://ipfs.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

### 📁 **Decentralized File Storage**
- **Traditional IPFS Upload**: Store files on IPFS with Pinata gateway
- **Web3 Storage**: Smart contract-based storage with NFT minting
- **Physical Storage Network**: Contribute real device storage space
- **Real-time File Analytics**: Live network statistics and file tracking

### 🪙 **Token Economy**
- **DESTORE Token Rewards**: Earn tokens for contributing storage
- **Flexible Reward System**: 10 tokens for 10-20GB, 0.5 tokens per GB for larger contributions
- **Storage Provider NFTs**: Exclusive NFTs for verified storage contributors
- **On-chain Verification**: Ethereum testnet integration for storage proof

### 🔐 **Security & Privacy**
- **File Encryption**: Automatic encryption for all stored files
- **Data Chunking**: Files split across multiple nodes for redundancy
- **Reed-Solomon Erasure Coding**: Advanced error correction
- **MetaMask Integration**: Secure Web3 wallet connection

### 📊 **Real-time Analytics**
- **Network Health Monitoring**: Live performance metrics
- **Storage Statistics**: Real-time capacity and usage tracking
- **Peer Discovery**: Automatic detection of storage nodes
- **Performance Metrics**: Upload/download speeds, latency, success rates

## 🛠️ Technology Stack

### **Frontend**
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Radix UI** - Accessible component library

### **Backend & Storage**
- **Supabase** - PostgreSQL database for metadata
- **Pinata IPFS** - Decentralized file storage
- **IndexedDB** - Local storage for file chunks
- **Clerk** - User authentication and management

### **Blockchain**
- **Ethereum** - Smart contract platform
- **Hardhat** - Development environment
- **ethers.js** - Ethereum library
- **OpenZeppelin** - Secure contract standards
- **MetaMask** - Web3 wallet integration

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** browser extension
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/De-store.git
cd destore
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Pinata IPFS Configuration
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
VITE_PINATA_JWT=your_pinata_jwt_token

# Blockchain Configuration
VITE_DESTORE_TOKEN_ADDRESS=contract_address
VITE_STORAGE_NETWORK_ADDRESS=contract_address
VITE_STORAGE_NFT_ADDRESS=contract_address
VITE_MARKETPLACE_ADDRESS=contract_address
VITE_CHAIN_ID=1337
VITE_RPC_URL=http://127.0.0.1:8545
```

### 4. Start Hardhat Local Network
```bash
npx hardhat node
```

### 5. Deploy Smart Contracts
```bash
npx hardhat run scripts/deploy.cjs --network localhost
```

### 6. Start Development Server
```bash
npm run dev
```

### 7. Configure MetaMask
- **Network Name**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 1337
- **Currency Symbol**: ETH
- **Import Test Account**: Use private key `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

## 📖 Usage Guide

### 🔄 **File Upload Options**

1. **Traditional Upload**:
   - Select files using drag & drop or file picker
   - Files are stored on IPFS via Pinata
   - Metadata saved to Supabase database

2. **Web3 Upload**:
   - Connect MetaMask wallet
   - Upload files with smart contract interaction
   - Automatic NFT minting for file ownership
   - On-chain storage verification

3. **Contribute Storage**:
   - Allocate physical device storage (10GB - 1TB)
   - Earn DESTORE tokens for hosting files
   - Receive exclusive Storage Provider NFT
   - Join the decentralized storage network

### 📊 **Dashboard Features**

- **Upload Section**: Multi-tab file upload interface
- **My Files**: View and manage uploaded files
- **Network Status**: Real-time network analytics
- **Settings**: Network diagnostics and configuration

### 🔍 **Network Analytics**

- **Files Stored**: Total network file count (updates every 3 seconds)
- **Active Peers**: Number of online storage providers
- **Storage Capacity**: Total and used storage across network
- **Performance Metrics**: Upload/download speeds, latency
- **Network Health**: Overall system reliability score

## 🏗️ Architecture

### **Smart Contracts**

1. **DestoreToken.sol**: ERC-20 token for rewards
2. **StorageNetwork.sol**: Core storage network logic
3. **StorageNFT.sol**: ERC-721 tokens for file ownership
4. **StorageMarketplace.sol**: Storage deals and trading

### **File Storage Flow**

1. **File Upload** → **Encryption** → **Chunking** → **Distribution**
2. **IPFS Storage** → **Metadata Database** → **Smart Contract** → **NFT Minting**
3. **Physical Storage** → **Token Rewards** → **Network Analytics**

### **Real-time Updates**

- **3-second intervals** for network statistics
- **WebSocket connections** for live data
- **IndexedDB syncing** for offline capability

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Contract Tests
```bash
npx hardhat test
```

### Real Storage Testing
See [REAL_STORAGE_TESTING.md](./REAL_STORAGE_TESTING.md) for detailed testing procedures.

## 📚 Setup Guides

- **[Clerk Authentication Setup](./CLERK_SETUP.md)** - User authentication configuration
- **[Pinata IPFS Setup](./PINATA_SETUP.md)** - Decentralized storage configuration
- **[Supabase Database Setup](./SUPABASE_SETUP.md)** - Backend database configuration

## 🚀 Deployment

### **Netlify Deployment**

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your Git repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables from `.env.local`

### **Environment Variables for Production**

Ensure all environment variables are properly configured in your deployment platform:

- Clerk keys for authentication
- Supabase credentials for database
- Pinata keys for IPFS storage
- Contract addresses for blockchain integration

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**

- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all linting passes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ethereum Foundation** for blockchain infrastructure
- **IPFS Protocol Labs** for decentralized storage
- **OpenZeppelin** for secure smart contract standards
- **Radix UI** for accessible components
- **Clerk** for authentication infrastructure
- **Supabase** for backend services

## 📞 Support

- **Documentation**: Check setup guides in the project
- **Issues**: Create an issue on GitHub
- **Discussions**: Join our community discussions

---

<div align="center">
  <strong>Built with ❤️ for the decentralized future</strong>
  <br>
  <em>Empowering users to own their data and earn from sharing storage</em>
</div>