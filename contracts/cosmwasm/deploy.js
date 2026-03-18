require("dotenv").config();
const fs = require("fs");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { GasPrice } = require("@cosmjs/stargate");

const RPC = "https://rpc.sei-apis.com";
const CHAIN_PREFIX = "sei";
const CW721_CONTRACT =
  "sei13g0nupntdq7fp09z8gc6s42g4qjduh9aw64mp5z7hf5hzmlvdmrqf4hay9";
const FEE_BPS = 250;
const WASM_PATH =
  process.argv[2] ||
  "./artifacts/junkies_marketplace.wasm";

async function main() {
  const raw = process.env.DEPLOYER_MNEMONIC;
  if (!raw) {
    console.error("Set DEPLOYER_MNEMONIC in .env (12 or 24 word seed phrase)");
    process.exit(1);
  }
  const mnemonic = raw.trim().replace(/\s+/g, " ");
  const wordCount = mnemonic.split(" ").length;
  console.log(`Mnemonic loaded: ${wordCount} words`);
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    console.error(`Expected 12 or 24 words, got ${wordCount}. Check your .env file.`);
    process.exit(1);
  }

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: CHAIN_PREFIX,
  });
  const [account] = await wallet.getAccounts();
  console.log("Deployer address:", account.address);

  const feeRecipient = process.env.FEE_RECIPIENT || account.address;

  const client = await SigningCosmWasmClient.connectWithSigner(RPC, wallet, {
    gasPrice: GasPrice.fromString("0.02usei"),
  });

  const balance = await client.getBalance(account.address, "usei");
  console.log("Balance:", (Number(balance.amount) / 1e6).toFixed(4), "SEI");

  const wasmCode = fs.readFileSync(WASM_PATH);
  console.log("Wasm size:", (wasmCode.length / 1024).toFixed(1), "KB");
  console.log("Uploading wasm...");

  const uploadResult = await client.upload(account.address, wasmCode, "auto");
  console.log("Code ID:", uploadResult.codeId);
  console.log("Upload tx:", uploadResult.transactionHash);

  const initMsg = {
    cw721_contract: CW721_CONTRACT,
    fee_bps: FEE_BPS,
    fee_recipient: feeRecipient,
  };

  console.log("Instantiating with:", JSON.stringify(initMsg, null, 2));

  const instantiateResult = await client.instantiate(
    account.address,
    uploadResult.codeId,
    initMsg,
    "JunkiesMarketplace",
    "auto",
    { admin: account.address }
  );

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Contract address:", instantiateResult.contractAddress);
  console.log("Tx hash:", instantiateResult.transactionHash);
  console.log(
    "\nAdd this to your indexer .env and Render dashboard:"
  );
  console.log(
    `COSMWASM_MARKETPLACE=${instantiateResult.contractAddress}`
  );
}

main().catch((err) => {
  console.error("Deploy failed:", err.message || err);
  process.exit(1);
});
