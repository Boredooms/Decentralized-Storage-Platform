# 🌐 DeStore - Decentralized Storage Network

<div align="center">
  <img src="https://img.shields.io/badge/🚀_Status-Live-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/🏆_Hackathon-Avalanche-blue" alt="Hackathon">
  <img src="https://img.shields.io/badge/⭐_Version-1.0.0-gold" alt="Version">
</div>

<div align="center">
  <h3>🔥 Revolutionary Decentralized Storage Platform 🔥</h3>
  <p><em>Combining Web3 technology with real physical storage contribution</em></p>
  <p><strong>Store files securely • Earn DESTORE tokens • Join the future of storage</strong></p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/💾_Storage-Decentralized-purple" alt="Storage">
  <img src="https://img.shields.io/badge/🪙_Earn-DESTORE_Tokens-orange" alt="Tokens">
  <img src="https://img.shields.io/badge/🔒_Security-Enterprise_Grade-red" alt="Security">
  <img src="https://img.shields.io/badge/🌍_Network-Global_Peers-green" alt="Network">
</div>

<div align="center">
  
[![Built with React](https://img.shields.io/badge/Built%20with-React%2019-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![Powered by Ethereum](https://img.shields.io/badge/Powered%20by-Ethereum-627EEA.svg?style=for-the-badge&logo=ethereum)](https://ethereum.org/)
[![IPFS Storage](https://img.shields.io/badge/Storage-IPFS-65C2CB.svg?style=for-the-badge&logo=ipfs)](https://ipfs.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## ✨ Key Highlights

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="https://img.shields.io/badge/💰-Earn_Tokens-gold?style=for-the-badge" alt="Earn">
        <br><strong>Monetize Storage</strong>
        <br><em>Turn unused storage into income</em>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/🔐-Secure_Files-red?style=for-the-badge" alt="Secure">
        <br><strong>Bank-Grade Security</strong>
        <br><em>Military-level encryption</em>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/🌍-Global_Network-green?style=for-the-badge" alt="Global">
        <br><strong>Worldwide Access</strong>
        <br><em>Files available anywhere</em>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/⚡-Lightning_Fast-blue?style=for-the-badge" alt="Fast">
        <br><strong>High Performance</strong>
        <br><em>Optimized for speed</em>
      </td>
    </tr>
  </table>
</div>

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
git clone https://github.com/Boredooms/Decentralized-Storage-Platform.git
cd Decentralized-Storage-Platform
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

---

## 🎆 Demo & Screenshots

<div align="center">
  <h3>📱 Try it Live!</h3>
  <p><strong>Experience the future of decentralized storage</strong></p>
  
  🔗 **[Live Demo](https://destore-platform.netlify.app)** | 📺 **[Video Walkthrough](#)** | 📊 **[Network Analytics](#)**
</div>

### 🖼️ Platform Screenshots

<details>
<summary>🏠 <strong>Dashboard Overview</strong></summary>

- **File Upload Interface**: Drag & drop with multiple upload options
- **Network Analytics**: Real-time storage statistics
- **Token Rewards**: Live DESTORE token balance
- **Storage Contribution**: Easy storage allocation interface

</details>

<details>
<summary>📁 <strong>File Management</strong></summary>

- **My Files**: Complete file library with metadata
- **File Sharing**: Secure link generation
- **Storage Providers**: Network of global peers
- **NFT Gallery**: Storage Provider NFT collection

</details>

<details>
<summary>📊 <strong>Analytics Dashboard</strong></summary>

- **Network Health**: Real-time performance metrics
- **Storage Statistics**: Capacity and usage tracking
- **Peer Discovery**: Active node monitoring
- **Revenue Tracking**: Token earnings overview

</details>

## 🎯 Quick Demo

```bash
# 1️⃣ Start the platform
npm run dev

# 2️⃣ Upload your first file
# Visit http://localhost:5173
# Connect MetaMask wallet
# Drag & drop any file to upload

# 3️⃣ Contribute storage & earn tokens
# Navigate to "Contribute Storage"
# Allocate 10GB+ storage space
# Start earning DESTORE tokens immediately!
```

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
  <img src="https://img.shields.io/badge/🔥-Built_for_Avalanche_Hackathon-red?style=for-the-badge" alt="Hackathon">
  <br><br>
  <h2>🏆 Award-Winning Decentralized Storage Solution</h2>
  <p><strong>✨ Built with passion for the decentralized future ✨</strong></p>
  <br>
  
  <table>
    <tr>
      <td align="center">
        <img src="https://img.shields.io/badge/🚀-Innovation-blue?style=for-the-badge" alt="Innovation">
        <br><strong>Revolutionary Technology</strong>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/🌍-Global_Impact-green?style=for-the-badge" alt="Impact">
        <br><strong>Worldwide Accessibility</strong>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/💰-Economic_Model-gold?style=for-the-badge" alt="Economic">
        <br><strong>Sustainable Economy</strong>
      </td>
    </tr>
  </table>
  
  <br>
  <h3>🔄 Join the Storage Revolution</h3>
  <p>
    <strong>💾 Store Files</strong> • 
    <strong>🪙 Earn Tokens</strong> • 
    <strong>🌐 Global Network</strong> • 
    <strong>🔒 Ultimate Security</strong>
  </p>
  
  <br>
  
  ### 📧 Connect With Us
  
  🐦 **[Twitter](https://twitter.com/DeStorePlatform)** • 
  💬 **[Discord](https://discord.gg/destore)** • 
  📺 **[YouTube](https://youtube.com/@DeStorePlatform)** • 
  🔗 **[LinkedIn](https://linkedin.com/company/destore)**
  
  <br>
  
  ---
  
  <h3>❤️ Built with passion for the decentralized future</h3>
  <p><em>🌟 Empowering users to own their data and earn from sharing storage 🌟</em></p>
  
  <br>
  
  **🔥 Ready to revolutionize storage? Let's build the future together! 🔥**
  
</div>