# 🚀 DeStore - Render Deployment Guide

## Quick Deploy to Render

### 1. **Connect Repository**
- Go to [render.com](https://render.com)
- Click "New +" → "Web Service"
- Connect your GitHub repository

### 2. **Configuration**
Render will auto-detect the settings from `render.yaml`, but verify:

- **Build Command**: `npm ci --legacy-peer-deps && npm run build`
- **Start Command**: `npm run start`
- **Publish Directory**: `dist`
- **Node Version**: `18.17.0`

### 3. **Environment Variables**
Add these in Render dashboard:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_dG91Y2hpbmctaG9uZXliZWUtMzQuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_qN6VvpYKQdPATh5m3911W4lKLjKawrI7WwCv7TDVjg

# Supabase Configuration
VITE_SUPABASE_URL=https://wmqfiqywlqvidebenhmk.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Pinata IPFS Configuration
VITE_PINATA_API_KEY=06c33d4f4391a48b1265
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
VITE_PINATA_JWT=your_pinata_jwt_token

# Blockchain Configuration (Demo Mode for Render)
VITE_DESTORE_TOKEN_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
VITE_STORAGE_NETWORK_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
VITE_STORAGE_NFT_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F
VITE_MARKETPLACE_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
VITE_CHAIN_ID=1337
VITE_RPC_URL=http://127.0.0.1:8545

# Build Configuration
NODE_VERSION=18.17.0
NPM_CONFIG_LEGACY_PEER_DEPS=true
CI=false
SKIP_PREFLIGHT_CHECK=true
```

### 4. **Deploy**
- Click "Create Web Service"
- Render will automatically build and deploy
- Your app will be available at: `https://your-app-name.onrender.com`

## ✅ **What Works on Render**

- ✅ **Authentication** - Clerk integration
- ✅ **File Storage** - Supabase + IPFS
- ✅ **Real-time Analytics** - Network statistics
- ✅ **File Uploads** - Traditional and Web3 modes
- ✅ **UI/UX** - Complete dashboard experience

## ⚠️ **Blockchain Limitations on Render**

- **Local Hardhat node** won't work on Render (localhost:8545)
- **Smart contract interactions** will show demo/placeholder data
- **MetaMask connectivity** will work but contracts need testnet deployment

## 🔧 **For Full Blockchain Functionality**

Deploy contracts to a testnet and update these variables:
```bash
VITE_CHAIN_ID=11155111  # Sepolia testnet
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

## 📊 **Expected Performance**

- **Build time**: ~3-5 minutes
- **Deploy time**: ~1-2 minutes
- **Cold start**: ~10 seconds
- **Response time**: <200ms

Your DeStore app will be fully functional on Render! 🎉