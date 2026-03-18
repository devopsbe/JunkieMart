const hre = require("hardhat");

async function main() {
  const nftAddress = process.env.ERC721_POINTER || "0x9c979cD31D0C7b5764876cB4175484fe1206f091";
  const feeRecipient = process.env.FEE_RECIPIENT || (await hre.ethers.getSigners())[0].address;

  const Market = await hre.ethers.getContractFactory("JunkiesMarket");
  const market = await Market.deploy(nftAddress, feeRecipient);
  await market.waitForDeployment();

  console.log(`JunkiesMarket deployed to: ${await market.getAddress()}`);
  console.log(`NFT contract: ${nftAddress}`);
  console.log(`Fee recipient: ${feeRecipient}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
