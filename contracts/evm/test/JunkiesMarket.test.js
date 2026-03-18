const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JunkiesMarket", function () {
  let market, nft, owner, seller, buyer, feeRecipient;

  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient] = await ethers.getSigners();

    const MockNFT = await ethers.getContractFactory("MockERC721");
    nft = await MockNFT.deploy();
    await nft.waitForDeployment();

    const Market = await ethers.getContractFactory("JunkiesMarket");
    market = await Market.deploy(await nft.getAddress(), feeRecipient.address);
    await market.waitForDeployment();

    await nft.mint(seller.address, 1);
    await nft.connect(seller).setApprovalForAll(await market.getAddress(), true);
  });

  it("should list an NFT", async function () {
    await market.connect(seller).listNFT(1, ethers.parseEther("10"));
    const listing = await market.listings(1);
    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(ethers.parseEther("10"));
  });

  it("should buy a listed NFT", async function () {
    await market.connect(seller).listNFT(1, ethers.parseEther("10"));
    await market.connect(buyer).buyNFT(1, { value: ethers.parseEther("10") });
    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("should cancel a listing", async function () {
    await market.connect(seller).listNFT(1, ethers.parseEther("10"));
    await market.connect(seller).cancelListing(1);
    expect(await nft.ownerOf(1)).to.equal(seller.address);
  });

  it("should update price", async function () {
    await market.connect(seller).listNFT(1, ethers.parseEther("10"));
    await market.connect(seller).updatePrice(1, ethers.parseEther("20"));
    const listing = await market.listings(1);
    expect(listing.price).to.equal(ethers.parseEther("20"));
  });

  it("should reject buy with wrong price", async function () {
    await market.connect(seller).listNFT(1, ethers.parseEther("10"));
    await expect(
      market.connect(buyer).buyNFT(1, { value: ethers.parseEther("5") })
    ).to.be.revertedWith("Wrong price");
  });

  it("should reject cancel from non-seller", async function () {
    await market.connect(seller).listNFT(1, ethers.parseEther("10"));
    await expect(
      market.connect(buyer).cancelListing(1)
    ).to.be.revertedWith("Not seller");
  });

  it("should allow owner to pause", async function () {
    await market.connect(owner).setPaused(true);
    await expect(
      market.connect(seller).listNFT(1, ethers.parseEther("10"))
    ).to.be.revertedWith("Marketplace paused");
  });
});
