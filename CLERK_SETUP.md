# Clerk Authentication Setup Guide

## 🚀 Quick Setup for Your Hackathon Project

### 1. Create a Clerk Account
1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign up with your email or GitHub
3. Create a new application

### 2. Get Your API Keys
1. In your Clerk dashboard, go to "API Keys"
2. Copy the "Publishable Key" and "Secret Key"

### 3. Update Environment Variables
Replace the placeholder values in your `.env.local` file:

```bash
# Replace these with your actual Clerk keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_key_here
```

### 4. Recommended Clerk Configuration

**Authentication Methods** (enable in Clerk dashboard):
- ✅ Email/Password
- ✅ Google OAuth (quick setup)
- ✅ GitHub OAuth (great for developers)
- ✅ Magic Links (passwordless)

**Settings to Configure**:
- **Sign-up mode**: Public (allow anyone to sign up)
- **Session timeout**: 7 days (good for hackathons)
- **Multi-factor auth**: Optional
- **Email verification**: Optional (faster testing)

### 5. Test Your Setup
1. Save your `.env.local` file with the real keys
2. Restart your dev server: `npm run dev`
3. Visit your app and click "Sign In"
4. You should see Clerk's authentication UI

### 6. Features You Now Have

✅ **No more JWT errors** - Clerk handles all authentication  
✅ **Professional UI** - Pre-built sign-in/sign-up forms  
✅ **User management** - Built-in user profiles and sessions  
✅ **Social logins** - Google, GitHub, etc. with one click  
✅ **Security** - Enterprise-grade security by default  

### 7. Quick Testing
- The app should load without authentication errors
- Authentication UI should appear when clicking "Sign In"
- Users can sign up and access the dashboard
- Wallet connection and file upload features are ready for blockchain integration

### 📱 Ready for Integration
Your app now has clean authentication and is ready for:
- Smart contract integration (StorageNFT, StorageMarketplace)
- IPFS/Pinata file storage
- Web3 wallet connections
- Blockchain interactions

## 🎯 Benefits for Your Hackathon
- **Fast setup** - 5 minutes vs hours of JWT debugging
- **Professional look** - Impress judges with polished auth UI
- **Focus on features** - Spend time on core blockchain functionality
- **Scalable** - Production-ready authentication system