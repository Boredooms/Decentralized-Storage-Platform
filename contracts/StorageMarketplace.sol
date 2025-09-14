// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StorageMarketplace
 * @dev Marketplace for peer-to-peer storage deals
 * Allows storage providers to offer storage and users to rent storage space
 */
contract StorageMarketplace is ReentrancyGuard, Ownable, Pausable {
    
    // Storage deal structure
    struct StorageDeal {
        uint256 dealId;
        address provider;
        address renter;
        uint256 fileSize;
        uint256 pricePerByte;
        uint256 duration;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isCompleted;
        string proofHash;
    }
    
    // Storage provider profile
    struct ProviderProfile {
        address provider;
        uint256 totalCapacity;
        uint256 usedCapacity;
        uint256 reputation;
        bool isActive;
        string location;
        uint256 pricePerByte;
    }
    
    // Events
    event DealCreated(
        uint256 indexed dealId,
        address indexed provider,
        address indexed renter,
        uint256 fileSize,
        uint256 price
    );
    
    event DealCompleted(uint256 indexed dealId);
    event DealCancelled(uint256 indexed dealId);
    event ProviderRegistered(address indexed provider, uint256 capacity);
    event ProofSubmitted(uint256 indexed dealId, string proofHash);
    
    // State variables
    uint256 private _dealIdCounter;
    mapping(uint256 => StorageDeal) public deals;
    mapping(address => ProviderProfile) public providers;
    mapping(address => uint256[]) public userDeals;
    mapping(address => uint256[]) public providerDeals;
    
    // Deal status constants
    uint256 public constant DEAL_PENDING = 0;
    uint256 public constant DEAL_ACTIVE = 1;
    uint256 public constant DEAL_COMPLETED = 2;
    uint256 public constant DEAL_CANCELLED = 3;
    
    // Minimum deal duration (1 hour)
    uint256 public minDealDuration = 3600;
    
    // Maximum deal duration (1 year)
    uint256 public maxDealDuration = 365 days;
    
    // Platform fee (in basis points, 100 = 1%)
    uint256 public platformFee = 250; // 2.5%
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Register as a storage provider
     * @param capacity Total storage capacity in bytes
     * @param pricePerByte Price per byte per second in wei
     * @param location Geographic location (optional)
     */
    function registerProvider(
        uint256 capacity,
        uint256 pricePerByte,
        string memory location
    ) external {
        require(capacity > 0, "Capacity must be greater than 0");
        require(pricePerByte > 0, "Price must be greater than 0");
        require(!providers[msg.sender].isActive, "Provider already registered");
        
        providers[msg.sender] = ProviderProfile({
            provider: msg.sender,
            totalCapacity: capacity,
            usedCapacity: 0,
            reputation: 100, // Start with 100 reputation points
            isActive: true,
            location: location,
            pricePerByte: pricePerByte
        });
        
        emit ProviderRegistered(msg.sender, capacity);
    }
    
    /**
     * @dev Create a storage deal
     * @param provider Address of the storage provider
     * @param fileSize Size of the file in bytes
     * @param duration Duration of storage in seconds
     */
    function createDeal(
        address provider,
        uint256 fileSize,
        uint256 duration
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(providers[provider].isActive, "Provider not active");
        require(fileSize > 0, "File size must be greater than 0");
        require(duration >= minDealDuration, "Duration too short");
        require(duration <= maxDealDuration, "Duration too long");
        require(providers[provider].usedCapacity + fileSize <= providers[provider].totalCapacity, "Insufficient capacity");
        
        uint256 dealId = _dealIdCounter++;
        uint256 totalPrice = fileSize * providers[provider].pricePerByte * duration;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        deals[dealId] = StorageDeal({
            dealId: dealId,
            provider: provider,
            renter: msg.sender,
            fileSize: fileSize,
            pricePerByte: providers[provider].pricePerByte,
            duration: duration,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true,
            isCompleted: false,
            proofHash: ""
        });
        
        // Update provider's used capacity
        providers[provider].usedCapacity += fileSize;
        
        // Track deals for users
        userDeals[msg.sender].push(dealId);
        providerDeals[provider].push(dealId);
        
        // Calculate platform fee
        uint256 fee = (totalPrice * platformFee) / 10000;
        uint256 providerPayment = totalPrice - fee;
        
        // Transfer payment to provider
        payable(provider).transfer(providerPayment);
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit DealCreated(dealId, provider, msg.sender, fileSize, totalPrice);
        
        return dealId;
    }
    
    /**
     * @dev Submit proof of storage
     * @param dealId ID of the deal
     * @param proofHash Hash of the storage proof
     */
    function submitProof(uint256 dealId, string memory proofHash) external {
        StorageDeal storage deal = deals[dealId];
        require(deal.provider == msg.sender, "Only provider can submit proof");
        require(deal.isActive, "Deal not active");
        require(deal.endTime > block.timestamp, "Deal expired");
        
        deal.proofHash = proofHash;
        
        emit ProofSubmitted(dealId, proofHash);
    }
    
    /**
     * @dev Complete a storage deal
     * @param dealId ID of the deal
     */
    function completeDeal(uint256 dealId) external {
        StorageDeal storage deal = deals[dealId];
        require(deal.renter == msg.sender || deal.provider == msg.sender, "Not authorized");
        require(deal.isActive, "Deal not active");
        require(deal.endTime <= block.timestamp, "Deal not expired yet");
        
        deal.isActive = false;
        deal.isCompleted = true;
        
        // Free up provider capacity
        providers[deal.provider].usedCapacity -= deal.fileSize;
        
        // Update provider reputation
        if (bytes(deal.proofHash).length > 0) {
            providers[deal.provider].reputation += 10; // Reward for providing proof
        } else {
            providers[deal.provider].reputation -= 5; // Penalty for not providing proof
        }
        
        emit DealCompleted(dealId);
    }
    
    /**
     * @dev Cancel a storage deal (only before it starts)
     * @param dealId ID of the deal
     */
    function cancelDeal(uint256 dealId) external {
        StorageDeal storage deal = deals[dealId];
        require(deal.renter == msg.sender, "Only renter can cancel");
        require(deal.isActive, "Deal not active");
        require(deal.startTime > block.timestamp, "Deal already started");
        
        deal.isActive = false;
        
        // Free up provider capacity
        providers[deal.provider].usedCapacity -= deal.fileSize;
        
        // Refund payment
        uint256 refundAmount = deal.fileSize * deal.pricePerByte * deal.duration;
        payable(deal.renter).transfer(refundAmount);
        
        emit DealCancelled(dealId);
    }
    
    /**
     * @dev Get deals for a user
     * @param user Address of the user
     */
    function getUserDeals(address user) external view returns (uint256[] memory) {
        return userDeals[user];
    }
    
    /**
     * @dev Get deals for a provider
     * @param provider Address of the provider
     */
    function getProviderDeals(address provider) external view returns (uint256[] memory) {
        return providerDeals[provider];
    }
    
    /**
     * @dev Get active providers
     */
    function getActiveProviders() external view returns (address[] memory) {
        uint256 count = 0;
        // Count active providers (simplified - in production, use events or separate mapping)
        address[] memory temp = new address[](100); // Max 100 providers for gas limit
        
        // This is a simplified implementation
        // In production, you'd maintain a list of active providers
        return temp;
    }
    
    /**
     * @dev Update provider capacity
     * @param newCapacity New total capacity
     */
    function updateProviderCapacity(uint256 newCapacity) external {
        require(providers[msg.sender].isActive, "Provider not registered");
        require(newCapacity >= providers[msg.sender].usedCapacity, "New capacity too small");
        
        providers[msg.sender].totalCapacity = newCapacity;
    }
    
    /**
     * @dev Update provider price
     * @param newPrice New price per byte per second
     */
    function updateProviderPrice(uint256 newPrice) external {
        require(providers[msg.sender].isActive, "Provider not registered");
        require(newPrice > 0, "Price must be greater than 0");
        
        providers[msg.sender].pricePerByte = newPrice;
    }
    
    /**
     * @dev Deactivate provider
     */
    function deactivateProvider() external {
        require(providers[msg.sender].isActive, "Provider not active");
        require(providers[msg.sender].usedCapacity == 0, "Cannot deactivate with active deals");
        
        providers[msg.sender].isActive = false;
    }
    
    /**
     * @dev Update platform fee (owner only)
     * @param newFee New fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }
    
    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
