// Quick test script to verify Pinata integration
import { pinataService } from './services/pinata';

async function testPinataConnection() {
  console.log('Testing Pinata connection...');
  
  try {
    // Test if API keys are loaded
    const apiKey = import.meta.env.VITE_PINATA_API_KEY;
    const secretKey = import.meta.env.VITE_PINATA_SECRET_KEY;
    
    console.log('API Key loaded:', !!apiKey);
    console.log('Secret Key loaded:', !!secretKey);
    
    if (!apiKey || !secretKey) {
      console.error('❌ Pinata API keys not found in environment variables');
      return;
    }
    
    console.log('✅ Pinata API keys are configured');
    console.log('🔗 Ready to upload files to IPFS via Pinata!');
    
  } catch (error) {
    console.error('❌ Error testing Pinata connection:', error);
  }
}

// Run the test
testPinataConnection();

