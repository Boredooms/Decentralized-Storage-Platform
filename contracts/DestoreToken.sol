// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DestoreToken
 * @dev ERC20 token for rewarding storage contributions to the Destore network
 */
contract DestoreToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant STORAGE_REWARD_RATE = 1e18; // 1 DESTORE per GB per month
    uint256 public constant MIN_STORAGE_CONTRIBUTION = 10 * 1e9; // 10 GB minimum
    uint256 public constant MAX_STORAGE_CONTRIBUTION = 1000 * 1e9; // 1TB maximum
    
    mapping(address => uint256) public storageContributed; // in bytes
    mapping(address => uint256) public lastRewardClaim;
    mapping(address => bool) public isStorageProvider;
    
    event StorageContributed(address indexed provider, uint256 amount);
    event RewardsClaimed(address indexed provider, uint256 amount);
    event StorageRemoved(address indexed provider, uint256 amount);
    
    constructor() ERC20("Destore Token", "DESTORE") Ownable(msg.sender) {
        // Mint initial supply to deployer (100M tokens)
        _mint(msg.sender, 100_000_000 * 1e18);
    }
    
    /**
     * @dev Register storage contribution
     * @param storageAmount Amount of storage in bytes
     */
    function contributeStorage(uint256 storageAmount) external nonReentrant {
        require(storageAmount >= MIN_STORAGE_CONTRIBUTION, "Minimum 10GB required");
        require(storageAmount <= MAX_STORAGE_CONTRIBUTION, "Maximum 1TB allowed");
        
        if (!isStorageProvider[msg.sender]) {
            isStorageProvider[msg.sender] = true;
        }
        
        // Claim any pending rewards before updating storage
        if (storageContributed[msg.sender] > 0) {
            claimRewards();
        }
        
        storageContributed[msg.sender] += storageAmount;
        lastRewardClaim[msg.sender] = block.timestamp;
        
        // Immediate reward for new storage contribution (10 tokens for 10-20GB)
        uint256 immediateReward;
        if (storageAmount >= 10 * 1e9 && storageAmount <= 20 * 1e9) {
            immediateReward = 10 * 1e18; // 10 DESTORE tokens
        } else if (storageAmount > 20 * 1e9) {
            immediateReward = (storageAmount / 1e9) * 1e18 / 2; // 0.5 DESTORE per GB for larger contributions
        }
        
        if (immediateReward > 0) {
            _mint(msg.sender, immediateReward);
        }
        
        emit StorageContributed(msg.sender, storageAmount);
    }
    
    /**
     * @dev Claim storage rewards based on time and storage contributed
     */
    function claimRewards() public nonReentrant {
        require(isStorageProvider[msg.sender], "Not a storage provider");
        require(storageContributed[msg.sender] > 0, "No storage contributed");
        
        uint256 timeElapsed = block.timestamp - lastRewardClaim[msg.sender];
        uint256 monthsElapsed = timeElapsed / 30 days;
        
        if (monthsElapsed > 0) {
            uint256 storageGB = storageContributed[msg.sender] / 1e9;
            uint256 reward = storageGB * STORAGE_REWARD_RATE * monthsElapsed;
            
            if (reward > 0) {
                _mint(msg.sender, reward);
                lastRewardClaim[msg.sender] = block.timestamp;
                emit RewardsClaimed(msg.sender, reward);
            }
        }
    }
    
    /**
     * @dev Remove storage contribution
     * @param storageAmount Amount of storage to remove in bytes
     */
    function removeStorage(uint256 storageAmount) external nonReentrant {
        require(storageContributed[msg.sender] >= storageAmount, "Insufficient storage contributed");
        
        // Claim pending rewards before removal
        claimRewards();
        
        storageContributed[msg.sender] -= storageAmount;
        
        if (storageContributed[msg.sender] == 0) {
            isStorageProvider[msg.sender] = false;
        }
        
        emit StorageRemoved(msg.sender, storageAmount);
    }
    
    /**
     * @dev Get pending rewards for a storage provider
     */
    function getPendingRewards(address provider) external view returns (uint256) {
        if (!isStorageProvider[provider] || storageContributed[provider] == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - lastRewardClaim[provider];
        uint256 monthsElapsed = timeElapsed / 30 days;
        
        if (monthsElapsed == 0) {
            return 0;
        }
        
        uint256 storageGB = storageContributed[provider] / 1e9;
        return storageGB * STORAGE_REWARD_RATE * monthsElapsed;
    }
    
    /**
     * @dev Get total network storage
     */
    function getTotalNetworkStorage() external pure returns (uint256) {
        // This would need to be implemented with a storage registry
        // For now, return a placeholder
        return 0;
    }
}