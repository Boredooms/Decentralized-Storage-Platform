// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DestoreToken.sol";

/**
 * @title StorageNetwork
 * @dev Manages decentralized storage network and mints NFTs for storage providers
 */
contract StorageNetwork is ERC721URIStorage, Ownable, ReentrancyGuard {
    DestoreToken public destoreToken;
    
    struct StorageProvider {
        uint256 totalStorage; // in bytes
        uint256 usedStorage; // in bytes
        uint256 uploadCount;
        bool isActive;
        string endpoint; // IPFS or storage endpoint
        uint256 nftTokenId; // Associated NFT token
    }
    
    struct FileChunk {
        string chunkHash;
        address provider;
        uint256 size;
        uint256 uploadTime;
    }
    
    struct DistributedFile {
        string fileName;
        uint256 totalSize;
        address uploader;
        string[] chunkHashes;
        address[] chunkProviders;
        uint256 uploadTime;
        bool isActive;
    }
    
    mapping(address => StorageProvider) public storageProviders;
    mapping(string => FileChunk) public fileChunks; // chunkHash => FileChunk
    mapping(string => DistributedFile) public distributedFiles; // fileId => DistributedFile
    mapping(uint256 => address) public nftToProvider; // NFT token ID to provider address
    
    address[] public activeProviders;
    string[] public activeFileIds;
    
    uint256 public nextTokenId = 1;
    uint256 public constant CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    uint256 public constant MIN_REDUNDANCY = 3; // Minimum copies of each chunk
    
    event StorageProviderRegistered(address indexed provider, uint256 storageAmount, uint256 nftTokenId);
    event StorageProviderDeactivated(address indexed provider);
    event FileUploaded(string indexed fileId, address indexed uploader, uint256 totalSize);
    event ChunkStored(string indexed chunkHash, address indexed provider);
    event NFTMinted(address indexed provider, uint256 tokenId);
    
    constructor(address _destoreToken) ERC721("Destore Storage NFT", "DSTNFT") Ownable(msg.sender) {
        destoreToken = DestoreToken(_destoreToken);
    }
    
    /**
     * @dev Register as a storage provider and mint storage NFT
     */
    function registerStorageProvider(
        uint256 storageCapacity,
        string memory endpoint
    ) external nonReentrant {
        require(storageCapacity >= 10 * 1e9, "Minimum 10GB storage required");
        require(!storageProviders[msg.sender].isActive, "Already registered");
        
        // Mint NFT for storage provider
        uint256 tokenId = nextTokenId++;
        _mint(msg.sender, tokenId);
        
        // Set NFT metadata URI (could be updated to include storage stats)
        string memory tokenURI = string(abi.encodePacked(
            "data:application/json;base64,",
            _encodeMetadata(msg.sender, storageCapacity, endpoint)
        ));
        _setTokenURI(tokenId, tokenURI);
        
        // Register storage provider
        storageProviders[msg.sender] = StorageProvider({
            totalStorage: storageCapacity,
            usedStorage: 0,
            uploadCount: 0,
            isActive: true,
            endpoint: endpoint,
            nftTokenId: tokenId
        });
        
        nftToProvider[tokenId] = msg.sender;
        activeProviders.push(msg.sender);
        
        // Register storage contribution in token contract
        destoreToken.contributeStorage(storageCapacity);
        
        emit StorageProviderRegistered(msg.sender, storageCapacity, tokenId);
        emit NFTMinted(msg.sender, tokenId);
    }
    
    /**
     * @dev Upload file to distributed storage network
     */
    function uploadFileToNetwork(
        string memory fileId,
        string memory fileName,
        uint256 fileSize,
        string[] memory chunkHashes
    ) external nonReentrant {
        require(bytes(fileId).length > 0, "Invalid file ID");
        require(fileSize > 0, "Invalid file size");
        require(chunkHashes.length > 0, "No chunks provided");
        require(!distributedFiles[fileId].isActive, "File already exists");
        
        require(activeProviders.length >= MIN_REDUNDANCY, "Insufficient active providers");
        
        address[] memory selectedProviders = new address[](chunkHashes.length);
        
        // Distribute chunks to providers
        for (uint256 i = 0; i < chunkHashes.length; i++) {
            address provider = _selectProvider(fileSize / chunkHashes.length);
            require(provider != address(0), "No suitable provider found");
            
            // Store chunk information
            fileChunks[chunkHashes[i]] = FileChunk({
                chunkHash: chunkHashes[i],
                provider: provider,
                size: fileSize / chunkHashes.length,
                uploadTime: block.timestamp
            });
            
            selectedProviders[i] = provider;
            
            // Update provider stats
            storageProviders[provider].usedStorage += fileSize / chunkHashes.length;
            storageProviders[provider].uploadCount++;
            
            emit ChunkStored(chunkHashes[i], provider);
        }
        
        // Store distributed file information
        distributedFiles[fileId] = DistributedFile({
            fileName: fileName,
            totalSize: fileSize,
            uploader: msg.sender,
            chunkHashes: chunkHashes,
            chunkProviders: selectedProviders,
            uploadTime: block.timestamp,
            isActive: true
        });
        
        activeFileIds.push(fileId);
        
        emit FileUploaded(fileId, msg.sender, fileSize);
    }
    
    /**
     * @dev Select best provider for chunk storage
     */
    function _selectProvider(uint256 chunkSize) internal view returns (address) {
        address bestProvider = address(0);
        uint256 bestScore = 0;
        
        for (uint256 i = 0; i < activeProviders.length; i++) {
            address provider = activeProviders[i];
            StorageProvider memory sp = storageProviders[provider];
            
            if (!sp.isActive) continue;
            if (sp.totalStorage - sp.usedStorage < chunkSize) continue;
            
            // Score based on available storage and upload count (prefer less loaded providers)
            uint256 availableStorage = sp.totalStorage - sp.usedStorage;
            uint256 score = availableStorage / (sp.uploadCount + 1);
            
            if (score > bestScore) {
                bestScore = score;
                bestProvider = provider;
            }
        }
        
        return bestProvider;
    }
    
    /**
     * @dev Get file chunks and their providers
     */
    function getFileInfo(string memory fileId) external view returns (
        string memory fileName,
        uint256 totalSize,
        address uploader,
        string[] memory chunkHashes,
        address[] memory chunkProviders
    ) {
        DistributedFile memory file = distributedFiles[fileId];
        require(file.isActive, "File not found");
        
        return (
            file.fileName,
            file.totalSize,
            file.uploader,
            file.chunkHashes,
            file.chunkProviders
        );
    }
    
    /**
     * @dev Get storage provider stats
     */
    function getProviderStats(address provider) external view returns (
        uint256 totalStorage,
        uint256 usedStorage,
        uint256 uploadCount,
        bool isActive,
        uint256 nftTokenId
    ) {
        StorageProvider memory sp = storageProviders[provider];
        return (sp.totalStorage, sp.usedStorage, sp.uploadCount, sp.isActive, sp.nftTokenId);
    }
    
    /**
     * @dev Deactivate storage provider
     */
    function deactivateProvider() external {
        require(storageProviders[msg.sender].isActive, "Not an active provider");
        
        storageProviders[msg.sender].isActive = false;
        
        // Remove from active providers list
        for (uint256 i = 0; i < activeProviders.length; i++) {
            if (activeProviders[i] == msg.sender) {
                activeProviders[i] = activeProviders[activeProviders.length - 1];
                activeProviders.pop();
                break;
            }
        }
        
        emit StorageProviderDeactivated(msg.sender);
    }
    
    /**
     * @dev Get total network statistics
     */
    function getNetworkStats() external view returns (
        uint256 totalProviders,
        uint256 totalStorage,
        uint256 totalUsedStorage,
        uint256 totalFiles
    ) {
        uint256 totalStorageSum = 0;
        uint256 totalUsedSum = 0;
        
        for (uint256 i = 0; i < activeProviders.length; i++) {
            StorageProvider memory sp = storageProviders[activeProviders[i]];
            totalStorageSum += sp.totalStorage;
            totalUsedSum += sp.usedStorage;
        }
        
        return (
            activeProviders.length,
            totalStorageSum,
            totalUsedSum,
            activeFileIds.length
        );
    }
    
    /**
     * @dev Encode metadata for NFT
     */
    function _encodeMetadata(
        address provider,
        uint256 storageCapacity,
        string memory endpoint
    ) internal pure returns (string memory) {
        // This would encode JSON metadata for the NFT
        // For simplicity, returning a basic string
        return string(abi.encodePacked(
            '{"name":"Storage Provider NFT","description":"Destore Network Storage Provider","attributes":[',
            '{"trait_type":"Storage Capacity","value":"', _toString(storageCapacity / 1e9), ' GB"},',
            '{"trait_type":"Provider Address","value":"', _addressToString(provider), '"},',
            '{"trait_type":"Endpoint","value":"', endpoint, '"}',
            ']}'
        ));
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(addr);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}