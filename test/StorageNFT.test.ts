import { expect } from "chai";
import { ethers } from "hardhat";
import { StorageNFT } from "../typechain-types";

describe("StorageNFT", function () {
  let storageNFT: StorageNFT;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const StorageNFT = await ethers.getContractFactory("StorageNFT");
    storageNFT = await StorageNFT.deploy();
    await storageNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await storageNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await storageNFT.name()).to.equal("StorageNFT");
      expect(await storageNFT.symbol()).to.equal("SNFT");
    });

    it("Should have initial storage price", async function () {
      const price = await storageNFT.storagePricePerByte();
      expect(price).to.equal(ethers.parseEther("0.001"));
    });
  });

  describe("File Storage", function () {
    it("Should mint NFT for file storage", async function () {
      const fileSize = 1000; // 1KB
      const redundancyFactor = 3;
      const storageCost = fileSize * 0.001 * redundancyFactor;
      
      const tx = await storageNFT.connect(user1).mintFileStorage(
        "test.txt",
        fileSize,
        "text/plain",
        "0x1234567890abcdef",
        "encrypted_key_123",
        redundancyFactor,
        "https://example.com/metadata/1",
        { value: ethers.parseEther(storageCost.toString()) }
      );

      await expect(tx)
        .to.emit(storageNFT, "FileUploaded")
        .withArgs(0, user1.address, "test.txt", fileSize, "0x1234567890abcdef");

      expect(await storageNFT.ownerOf(0)).to.equal(user1.address);
      expect(await storageNFT.getTotalFiles()).to.equal(1);
    });

    it("Should prevent duplicate files", async function () {
      const fileSize = 1000;
      const redundancyFactor = 3;
      const storageCost = fileSize * 0.001 * redundancyFactor;
      const manifestHash = "0x1234567890abcdef";

      // First file
      await storageNFT.connect(user1).mintFileStorage(
        "test.txt",
        fileSize,
        "text/plain",
        manifestHash,
        "encrypted_key_123",
        redundancyFactor,
        "https://example.com/metadata/1",
        { value: ethers.parseEther(storageCost.toString()) }
      );

      // Second file with same manifest hash should fail
      await expect(
        storageNFT.connect(user2).mintFileStorage(
          "test2.txt",
          fileSize,
          "text/plain",
          manifestHash,
          "encrypted_key_456",
          redundancyFactor,
          "https://example.com/metadata/2",
          { value: ethers.parseEther(storageCost.toString()) }
        )
      ).to.be.revertedWith("File already exists");
    });

    it("Should refund excess payment", async function () {
      const fileSize = 1000;
      const redundancyFactor = 3;
      const storageCost = fileSize * 0.001 * redundancyFactor;
      const excessPayment = ethers.parseEther("1.0");

      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await storageNFT.connect(user1).mintFileStorage(
        "test.txt",
        fileSize,
        "text/plain",
        "0x1234567890abcdef",
        "encrypted_key_123",
        redundancyFactor,
        "https://example.com/metadata/1",
        { value: excessPayment }
      );

      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      // Check that excess payment was refunded
      expect(finalBalance).to.be.closeTo(
        initialBalance - BigInt(storageCost * 1e18) - gasUsed,
        ethers.parseEther("0.01") // Allow for small rounding differences
      );
    });
  });

  describe("File Retrieval", function () {
    beforeEach(async function () {
      const fileSize = 1000;
      const redundancyFactor = 3;
      const storageCost = fileSize * 0.001 * redundancyFactor;

      await storageNFT.connect(user1).mintFileStorage(
        "test.txt",
        fileSize,
        "text/plain",
        "0x1234567890abcdef",
        "encrypted_key_123",
        redundancyFactor,
        "https://example.com/metadata/1",
        { value: ethers.parseEther(storageCost.toString()) }
      );
    });

    it("Should retrieve file metadata", async function () {
      const metadata = await storageNFT.getFileMetadata(0);
      expect(metadata.name).to.equal("test.txt");
      expect(metadata.size).to.equal(1000);
      expect(metadata.mimeType).to.equal("text/plain");
      expect(metadata.manifestHash).to.equal("0x1234567890abcdef");
      expect(metadata.uploader).to.equal(user1.address);
    });

    it("Should find file by manifest hash", async function () {
      const tokenId = await storageNFT.getFileByManifest("0x1234567890abcdef");
      expect(tokenId).to.equal(0);
    });

    it("Should mark file as retrieved", async function () {
      await expect(
        storageNFT.connect(user1).markFileRetrieved(0)
      ).to.emit(storageNFT, "FileRetrieved")
      .withArgs(0, user1.address, "0x1234567890abcdef");
    });
  });

  describe("Admin Functions", function () {
    it("Should update storage price", async function () {
      const newPrice = ethers.parseEther("0.002");
      await storageNFT.updateStoragePrice(newPrice);
      expect(await storageNFT.storagePricePerByte()).to.equal(newPrice);
    });

    it("Should withdraw contract balance", async function () {
      // First, mint a file to add some balance
      const fileSize = 1000;
      const redundancyFactor = 3;
      const storageCost = fileSize * 0.001 * redundancyFactor;

      await storageNFT.connect(user1).mintFileStorage(
        "test.txt",
        fileSize,
        "text/plain",
        "0x1234567890abcdef",
        "encrypted_key_123",
        redundancyFactor,
        "https://example.com/metadata/1",
        { value: ethers.parseEther(storageCost.toString()) }
      );

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await storageNFT.withdraw();
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(finalBalance).to.be.greaterThan(initialBalance);
    });
  });
});


