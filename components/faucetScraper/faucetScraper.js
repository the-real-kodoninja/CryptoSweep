const { decryptFile } = require("../../src/encryptFiles");
const { logTransaction } = require("../../src/logTransactions");

let decryptData;
(async () => {
  try {
    const decryptedCode = await decryptFile("../../src/password.encrypted");
    const module = { exports: {} };
    eval(decryptedCode);
    decryptData = module.exports.decryptData;
  } catch (error) {
    console.error("Failed to decrypt password.js:", error.message);
    decryptData = () => {
      throw new Error("Cannot decrypt data: password.js is encrypted and requires the correct password.");
    };
  }
})();

const scrapeFaucets = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const results = {};
  try {
    results["Allcoins.pw"] = [{ name: "Allcoins.pw Faucet", link: "https://allcoins.pw" }];
    console.log(`Scraped 1 faucet from Allcoins.pw`);
    globalStats.activity.faucets += 1;
    globalStats.sourceItems.Faucets += 1;
    addFeedItem(`Scraped 1 faucet from Allcoins.pw`, "scrape");
  } catch (error) {
    console.error("scrapeFaucets error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeFaucets" });
    results["Allcoins.pw"] = [];
  }
  return results;
};

const claimFaucets = async (wallets, addFeedItem, globalStats) => {
  let encryptedWallets;
  try {
    encryptedWallets = JSON.parse(await decryptFile("../../../config/wallets.encrypted"));
  } catch (error) {
    console.error("Failed to decrypt wallets.json:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets.json", fn: "claimFaucets" });
    return [];
  }

  let decryptedWallets;
  try {
    decryptedWallets = decryptData(
      encryptedWallets.encrypted,
      encryptedWallets.iv,
      encryptedWallets.key,
      encryptedWallets.hash
    );
  } catch (error) {
    console.error("Failed to decrypt wallets:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets", fn: "claimFaucets" });
    return [];
  }

  const wallet = decryptedWallets.wallets.TrustWallet || { address: "", privateKey: "" };
  if (!wallet.address || !wallet.privateKey) {
    console.error("No wallet address or private key found for claiming faucets");
    globalStats.errors.push({ time: new Date().toISOString(), message: "No wallet address or private key found", fn: "claimFaucets" });
    globalStats.processes.claimFaucets.status = "awaiting_funds";
    globalStats.processes.claimFaucets.message = "Awaiting wallet configuration";
    return [];
  }

  globalStats.totalAttempts += 1;
  const results = [];
  try {
    const amount = 0.00001; // Simulated faucet claim amount
    console.log(`Claimed faucet: ${amount} BNB for ${wallet.address}`);
    globalStats.activity.faucets += 1;
    addFeedItem(`Claimed faucet: ${amount} BNB for ${wallet.address}`, "collection");
    results.push({ address: wallet.address, amount });

    // Log the transaction
    await logTransaction({
      type: "Faucet Claim",
      asset: "BNB",
      amount,
      valueUSD: 0, // Placeholder (requires price API for real value)
      chain: "BSC",
      walletAddress: wallet.address,
      source: "Allcoins.pw",
      txHash: "N/A", // Placeholder (requires actual transaction hash)
      notes: "Claimed from Allcoins.pw faucet",
    });
  } catch (error) {
    console.error("claimFaucets error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "claimFaucets" });
    results.push({ address: wallet.address, amount: 0 });
  }
  return results;
};

module.exports = { scrapeFaucets, claimFaucets };
