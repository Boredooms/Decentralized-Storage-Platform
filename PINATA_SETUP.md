# Pinata Setup Guide

## 1. Create Pinata Account

1. Go to [Pinata.cloud](https://pinata.cloud/)
2. Sign up for a free account
3. Verify your email address

## 2. Get API Keys

1. Log into your Pinata dashboard
2. Go to "API Keys" section
3. Click "New Key"
4. Give it a name (e.g., "DeStore App")
5. Select permissions:
   - `pinFileToIPFS` - Upload files
   - `pinJSONToIPFS` - Upload JSON metadata
   - `pinByHash` - Pin existing files
6. Copy the API Key and Secret Key

## 3. Configure Environment Variables

Create a `.env.local` file in the project root with:

```env
# Pinata Configuration
VITE_PINATA_API_KEY=your_api_key_here
VITE_PINATA_SECRET_KEY=your_secret_key_here
VITE_PINATA_JWT=your_jwt_here  # Optional
```

## 4. Test the Integration

1. Start the development server: `npm run dev`
2. Connect your MetaMask wallet
3. Try uploading a file through the Web3 Upload tab
4. Check the Pinata dashboard to see your uploaded files

## 5. File Storage Flow

1. **File Upload**: File is uploaded to IPFS via Pinata
2. **Metadata Creation**: JSON metadata is created and uploaded to IPFS
3. **Smart Contract**: NFT is minted with IPFS hashes
4. **Access**: Files can be accessed via IPFS gateways

## 6. IPFS Gateways

Files are accessible through multiple gateways:
- `https://gateway.pinata.cloud/ipfs/{hash}`
- `https://ipfs.io/ipfs/{hash}`
- `https://cloudflare-ipfs.com/ipfs/{hash}`
- `https://dweb.link/ipfs/{hash}`

## 7. Troubleshooting

- **API Key Issues**: Make sure your API keys are correct and have the right permissions
- **File Size Limits**: Free tier has limits on file size and bandwidth
- **Network Issues**: IPFS is decentralized, so files might take time to propagate

## 8. Production Considerations

- Upgrade to a paid Pinata plan for production use
- Implement proper error handling and retry logic
- Consider implementing file encryption before upload
- Set up monitoring for upload success rates


