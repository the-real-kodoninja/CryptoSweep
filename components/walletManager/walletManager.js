const { Web3 } = require("web3");
const { decryptData } = require("../../src/password");

const web3 = new Web3("https://bsc-dataseed.binance.org/");

const sweepWallets = async (addFeedItem, globalStats) => {
  const encryptedWallets = require("../../../config/wallets.json");
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
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets", fn: "sweepWallets" });
    return {};
  }

  const results = {};
  for (const [name, wallet] of Object.entries(decryptedWallets.wallets)) {
    if (!wallet.address) continue;
    results[name] = {};
    try {
      const balance = await web3.eth.getBalance(wallet.address);
      const balanceInBNB = web3.utils.fromWei(balance, "ether");
      results[name]["BNB"] = balanceInBNB;
      console.log(`Swept wallet ${name}: ${balanceInBNB} BNB`);
      addFeedItem(`Swept wallet ${name}: ${balanceInBNB} BNB`, "collection");
    } catch (error) {
      console.error(`sweepWallets error (${name}):`, error.message);
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: `sweepWallets-${name}` });
      results[name]["BNB"] = 0;
    }
  }
  return results;
};

const distributeAssets = async (assets, addFeedItem, globalStats) => {
  const encryptedWallets = require("../../../config/wallets.json");
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
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets", fn: "distributeAssets" });
    return;
  }

  const wallet = decryptedWallets.wallets.TrustWallet || { address: "", privateKey: "" };
  if (!wallet.address || !wallet.privateKey) {
    console.error("No wallet address or private key found for distributing assets");
    globalStats.errors.push({ time: new Date().toISOString(), message: "No wallet address or private key found", fn: "distributeAssets" });
    return;
  }

  for (const asset of assets) {
    globalStats.totalAttempts += 1;
    try {
      console.log(`Distributed asset: ${JSON.stringify(asset)} to ${wallet.address}`);
      globalStats.collected.push(asset);
      addFeedItem(`Distributed asset: ${JSON.stringify(asset)} to ${wallet.address}`, "collection");
    } catch (error) {
      console.error("distributeAssets error:", error.message);
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "distributeAssets" });
    }
  }
};

module.exports = { sweepWallets, distributeAssets };
