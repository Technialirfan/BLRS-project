// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LandToken
 * @author BLRS FYP Team
 * @notice ERC-721 NFT contract for land ownership certificates.
 *         Each approved land parcel is minted as a unique NFT.
 *         Token transfers occur automatically on ownership change.
 * @dev Extends ERC-721, Ownable, Pausable from OpenZeppelin v5
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RoleManager.sol";

contract LandToken is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, Pausable, ReentrancyGuard {
    RoleManager public roleManager;

    uint256 private _tokenIdCounter;

    mapping(uint256 => string) public tokenToParcel;
    mapping(string => uint256) public parcelToToken;
    mapping(string => bool) public hasToken;

    struct TokenMetadata {
        string parcelId;
        string ownerCNIC;
        string ownerName;
        string district;
        uint256 areaSqFt;
        string landType;
        uint256 mintedAt;
        address mintedBy;
    }

    mapping(uint256 => TokenMetadata) public tokenMetadata;

    uint256 public totalMinted;
    uint256 public totalBurned;

    event LandTokenMinted(
        uint256 indexed tokenId,
        string indexed parcelId,
        string ownerCNIC,
        string ownerName,
        address indexed mintedBy,
        uint256 timestamp
    );

    event LandTokenTransferred(
        uint256 indexed tokenId,
        string indexed parcelId,
        address from,
        address to,
        uint256 timestamp
    );

    event LandTokenBurned(uint256 indexed tokenId, string indexed parcelId, uint256 timestamp);

    error TokenAlreadyExists(string parcelId);
    error TokenNotFound(string parcelId);
    error NotAuthorized(address caller);
    error EmptyString(string field);

    modifier onlyDC() {
        if (!roleManager.isDC(msg.sender)) revert NotAuthorized(msg.sender);
        _;
    }

    modifier onlyTehsildarOrDC() {
        if (!roleManager.isTehsildar(msg.sender) && !roleManager.isDC(msg.sender)) revert NotAuthorized(msg.sender);
        _;
    }

    modifier onlyAdmin() {
        if (!roleManager.isAdmin(msg.sender)) revert NotAuthorized(msg.sender);
        _;
    }

    modifier notEmpty(string memory value, string memory field) {
        if (bytes(value).length == 0) revert EmptyString(field);
        _;
    }

    constructor(address roleManagerAddress)
        ERC721("Balochistan Land Certificate", "BLRS")
        Ownable(msg.sender)
    {
        require(roleManagerAddress != address(0), "LandToken: invalid RoleManager");
        roleManager = RoleManager(roleManagerAddress);
    }

    function mintLandCertificate(
        address toWallet,
        string calldata parcelId,
        string calldata ownerCNIC,
        string calldata ownerName,
        string calldata district,
        uint256 areaSqFt,
        string calldata landType,
        string calldata tokenURI_
    )
        external
        nonReentrant
        whenNotPaused
        onlyTehsildarOrDC
        notEmpty(parcelId, "parcelId")
        notEmpty(ownerCNIC, "ownerCNIC")
        notEmpty(ownerName, "ownerName")
        returns (uint256)
    {
        if (hasToken[parcelId]) revert TokenAlreadyExists(parcelId);
        require(toWallet != address(0), "LandToken: invalid wallet");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(toWallet, newTokenId);
        _setTokenURI(newTokenId, tokenURI_);

        tokenToParcel[newTokenId] = parcelId;
        parcelToToken[parcelId] = newTokenId;
        hasToken[parcelId] = true;

        tokenMetadata[newTokenId] = TokenMetadata({
            parcelId: parcelId,
            ownerCNIC: ownerCNIC,
            ownerName: ownerName,
            district: district,
            areaSqFt: areaSqFt,
            landType: landType,
            mintedAt: block.timestamp,
            mintedBy: msg.sender
        });

        totalMinted++;

        emit LandTokenMinted(newTokenId, parcelId, ownerCNIC, ownerName, msg.sender, block.timestamp);

        return newTokenId;
    }

    function transferLandCertificate(
        string calldata parcelId,
        address toWallet,
        string calldata newCNIC,
        string calldata newName
    ) external nonReentrant whenNotPaused onlyTehsildarOrDC {
        if (!hasToken[parcelId]) revert TokenNotFound(parcelId);
        require(toWallet != address(0), "LandToken: invalid wallet");

        uint256 tokenId = parcelToToken[parcelId];
        address from = ownerOf(tokenId);

        _transfer(from, toWallet, tokenId);

        tokenMetadata[tokenId].ownerCNIC = newCNIC;
        tokenMetadata[tokenId].ownerName = newName;

        emit LandTokenTransferred(tokenId, parcelId, from, toWallet, block.timestamp);
    }

    function burn(uint256 tokenId) public override {
        string memory parcelId = tokenToParcel[tokenId];
        super.burn(tokenId);

        if (bytes(parcelId).length > 0 && hasToken[parcelId]) {
            hasToken[parcelId] = false;
            totalBurned++;
            emit LandTokenBurned(tokenId, parcelId, block.timestamp);
        }
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function getTokenByParcel(string calldata parcelId) external view returns (uint256) {
        return parcelToToken[parcelId];
    }

    function getMetadata(uint256 tokenId) external view returns (TokenMetadata memory) {
        return tokenMetadata[tokenId];
    }

    function parcelHasToken(string calldata parcelId) external view returns (bool) {
        return hasToken[parcelId];
    }

    function totalSupply() external view returns (uint256) {
        return totalMinted - totalBurned;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}