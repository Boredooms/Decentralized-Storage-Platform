// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StorageNFT
 * @dev NFT contract for decentralized file storage with minting capabilities
 * Each NFT represents a file stored in the decentralized network
 */
contract StorageNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    
    // File storage metadata
    struct FileMetadata {
        string name;
        uint256 size;
        string mimeType;
        string ipfsHash; // IPFS hash instead of manifest hash
        string metadataHash; // IPFS hash of metadata JSON
        string encryptionKey;
        uint256 redundancyFactor;
        uint256 storagePrice;
        address uploader;
        uint256 uploadTime;
        bool isActive;
    }
    
    // Mapping from token ID to file metadata
    mapping(uint256 => FileMetadata) public fileMetadata;
    
    // Mapping from IPFS hash to token ID (for deduplication)
    mapping(string => uint256) public ipfsToToken;
    
    // Storage pricing (in wei per byte)
    uint256 public storagePricePerByte = 0.001 ether;
    
    // Minimum storage duration (in seconds)
    uint256 public minStorageDuration = 30 days;
    
    // Events
    event FileUploaded(
        uint256 indexed tokenId,
        address indexed uploader,
        string name,
        uint256 size,
        string ipfsHash
    );
    
    event FileRetrieved(
        uint256 indexed tokenId,
        address indexed retriever,
        string ipfsHash
    );
    
    event StoragePriceUpdated(uint256 newPrice);
    
    constructor() ERC721("StorageNFT", "SNFT") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new NFT for file storage
     * @param name File name
     * @param size File size in bytes
     * @param mimeType MIME type of the file
     * @param ipfsHash IPFS hash of the file
     * @param metadataHash IPFS hash of the metadata JSON
     * @param encryptionKey Encrypted file key
     * @param redundancyFactor Number of copies to store
     * @param _tokenURI URI for the NFT metadata
     */
    function mintFileStorage(
        string memory name,
        uint256 size,
        string memory mimeType,
        string memory ipfsHash,
        string memory metadataHash,
        string memory encryptionKey,
        uint256 redundancyFactor,
        string memory _tokenURI
    ) public payable nonReentrant returns (uint256) {
        require(bytes(name).length > 0, "File name cannot be empty");
        require(size > 0, "File size must be greater than 0");
        require(redundancyFactor > 0, "Redundancy factor must be greater than 0");
        require(ipfsToToken[ipfsHash] == 0, "File already exists");
        
        // Calculate storage cost
        uint256 storageCost = size * storagePricePerByte * redundancyFactor;
        require(msg.value >= storageCost, "Insufficient payment for storage");
        
        // Mint NFT
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Store file metadata
        fileMetadata[tokenId] = FileMetadata({
            name: name,
            size: size,
            mimeType: mimeType,
            ipfsHash: ipfsHash,
            metadataHash: metadataHash,
            encryptionKey: encryptionKey,
            redundancyFactor: redundancyFactor,
            storagePrice: storageCost,
            uploader: msg.sender,
            uploadTime: block.timestamp,
            isActive: true
        });
        
        // Map IPFS hash to token ID
        ipfsToToken[ipfsHash] = tokenId;
        
        // Refund excess payment
        if (msg.value > storageCost) {
            payable(msg.sender).transfer(msg.value - storageCost);
        }
        
        emit FileUploaded(tokenId, msg.sender, name, size, ipfsHash);
        
        return tokenId;
    }
    
    /**
     * @dev Retrieve file information
     * @param tokenId Token ID of the file
     */
    function getFileMetadata(uint256 tokenId) public view returns (FileMetadata memory) {
        require(tokenId < _tokenIdCounter, "Token does not exist");
        return fileMetadata[tokenId];
    }
    
    /**
     * @dev Check if a file exists by IPFS hash
     * @param ipfsHash IPFS hash of the file
     */
    function getFileByIPFS(string memory ipfsHash) public view returns (uint256) {
        return ipfsToToken[ipfsHash];
    }
    
    /**
     * @dev Mark file as retrieved (for analytics)
     * @param tokenId Token ID of the file
     */
    function markFileRetrieved(uint256 tokenId) public {
        require(tokenId < _tokenIdCounter, "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this file");
        require(fileMetadata[tokenId].isActive, "File is not active");
        
        emit FileRetrieved(tokenId, msg.sender, fileMetadata[tokenId].ipfsHash);
    }
    
    /**
     * @dev Deactivate a file (owner only)
     * @param tokenId Token ID of the file
     */
    function deactivateFile(uint256 tokenId) public {
        require(tokenId < _tokenIdCounter, "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this file");
        
        fileMetadata[tokenId].isActive = false;
    }
    
    /**
     * @dev Update storage price (owner only)
     * @param newPrice New price per byte in wei
     */
    function updateStoragePrice(uint256 newPrice) public onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        storagePricePerByte = newPrice;
        emit StoragePriceUpdated(newPrice);
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Get total number of files stored
     */
    function getTotalFiles() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Get files uploaded by a specific address
     * @param uploader Address of the uploader
     */
    function getFilesByUploader(address uploader) public view returns (uint256[] memory) {
        uint256 totalFiles = _tokenIdCounter;
        uint256[] memory temp = new uint256[](totalFiles);
        uint256 count = 0;
        
        for (uint256 i = 0; i < totalFiles; i++) {
            if (fileMetadata[i].uploader == uploader) {
                temp[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
