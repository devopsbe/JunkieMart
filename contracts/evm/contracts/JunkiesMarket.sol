// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract JunkiesMarket is Ownable, ReentrancyGuard {
    IERC721 public immutable nftContract;

    struct Listing {
        address seller;
        uint256 price;
        uint256 listedAt;
    }

    mapping(uint256 => Listing) public listings;

    uint256 public feeBps = 250;
    address public feeRecipient;
    bool public paused = false;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Sold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event Cancelled(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);

    constructor(address _nftContract, address _feeRecipient) Ownable(msg.sender) {
        nftContract = IERC721(_nftContract);
        feeRecipient = _feeRecipient;
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        require(!paused, "Marketplace paused");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
            nftContract.getApproved(tokenId) == address(this),
            "Not approved"
        );
        require(price > 0, "Price must be > 0");

        nftContract.transferFrom(msg.sender, address(this), tokenId);
        listings[tokenId] = Listing(msg.sender, price, block.timestamp);
        emit Listed(tokenId, msg.sender, price);
    }

    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.seller != address(0), "Not listed");
        require(msg.value == listing.price, "Wrong price");

        delete listings[tokenId];

        uint256 fee = (listing.price * feeBps) / 10000;
        uint256 sellerProceeds = listing.price - fee;

        nftContract.transferFrom(address(this), msg.sender, tokenId);
        payable(listing.seller).transfer(sellerProceeds);
        if (fee > 0) payable(feeRecipient).transfer(fee);

        emit Sold(tokenId, msg.sender, listing.seller, listing.price);
    }

    function cancelListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        delete listings[tokenId];
        nftContract.transferFrom(address(this), msg.sender, tokenId);
        emit Cancelled(tokenId, msg.sender);
    }

    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        require(newPrice > 0, "Price must be > 0");
        listings[tokenId].price = newPrice;
        emit PriceUpdated(tokenId, newPrice);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000);
        feeBps = _feeBps;
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        feeRecipient = _recipient;
    }
}
