import { ethers } from "hardhat";

async function main() {
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
  console.log("StorageNFT Address:", storageNFTAddress);
  console.log("StorageMarketplace Address:", marketplaceAddress);
  console.log("\nYou can now use these addresses in your frontend application.");
  
  // Save addresses to a file for easy reference
  const fs = require('fs');
  const addresses = {
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

