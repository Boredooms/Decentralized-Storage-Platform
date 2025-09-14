const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Starting deployment...");

  // Deploy DESTORE Token contract first
  console.log("Deploying DESTORE Token...");
  const DestoreToken = await ethers.getContractFactory("DestoreToken");
  const destoreToken = await DestoreToken.deploy();
  await destoreToken.waitForDeployment();
  const destoreTokenAddress = await destoreToken.getAddress();
  console.log("DESTORE Token deployed to:", destoreTokenAddress);

  // Deploy Storage Network contract
  console.log("Deploying Storage Network...");
  const StorageNetwork = await ethers.getContractFactory("StorageNetwork");
  const storageNetwork = await StorageNetwork.deploy(destoreTokenAddress);
  await storageNetwork.waitForDeployment();
  const storageNetworkAddress = await storageNetwork.getAddress();
  console.log("Storage Network deployed to:", storageNetworkAddress);

  console.log("Deploying StorageNFT contract...");
  
  // Get the contract factory
  const StorageNFT = await ethers.getContractFactory("StorageNFT");
  
  // Deploy the contract
  const storageNFT = await StorageNFT.deploy();
  await storageNFT.waitForDeployment();
  
  const storageNFTAddress = await storageNFT.getAddress();
  console.log("StorageNFT deployed to:", storageNFTAddress);
  
  console.log("Deploying StorageMarketplace contract...");
  
  // Get the marketplace contract factory
  const StorageMarketplace = await ethers.getContractFactory("StorageMarketplace");
  
  // Deploy the marketplace contract
  const marketplace = await StorageMarketplace.deploy();
  await marketplace.waitForDeployment();
  
  const marketplaceAddress = await marketplace.getAddress();
  console.log("StorageMarketplace deployed to:", marketplaceAddress);
  
  console.log("\n=== Deployment Summary ===");
  console.log("DESTORE Token Address:", destoreTokenAddress);
  console.log("Storage Network Address:", storageNetworkAddress);
  console.log("StorageNFT Address:", storageNFTAddress);
  console.log("StorageMarketplace Address:", marketplaceAddress);
  console.log("\nYou can now use these addresses in your frontend application.");
  
  // Save addresses to a file for easy reference
  const addresses = {
    DestoreToken: destoreTokenAddress,
    StorageNetwork: storageNetworkAddress,
    StorageNFT: storageNFTAddress,
    StorageMarketplace: marketplaceAddress,
    network: "localhost",
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    './deployed-addresses.json', 
    JSON.stringify(addresses, null, 2)
  );
  
  console.log("Addresses saved to deployed-addresses.json");
  
  // Output the addresses for the .env.local file
  console.log("\n=== Copy these to your .env.local file ===");
  console.log(`VITE_DESTORE_TOKEN_ADDRESS=${destoreTokenAddress}`);
  console.log(`VITE_STORAGE_NETWORK_ADDRESS=${storageNetworkAddress}`);
  console.log(`VITE_STORAGE_NFT_ADDRESS=${storageNFTAddress}`);
  console.log(`VITE_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});