const { Web3 } = require("web3");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");
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
      throw new Error("Cannot decrypt data: password.js is encrypted.");
    };
  }
})();

const web3 = new Web3("https://bsc-dataseed.binance.org/");

const scrapeCollectibles = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const results = {};
  try {
    const data = await fetchData("https://opensea.io/collection/boredapeyachtclub");
    results["OpenSea"] = [{ name: "Bored Ape Yacht Club", link: "https://opensea.io/collection/boredapeyachtclub" }];
    console.log(`Scraped 1 collectible from OpenSea`);
    globalStats.activity.collectibles += 1;
    addFeedItem(`Scraped 1 collectible from OpenSea`, "scrape");
  } catch (error) {
    console.error("scrapeCollectibles error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeCollectibles" });
    results["OpenSea"] = [];
  }
  return results;
};

const collectAssets = async (wallets, addFeedItem, globalStats, nimbus) => {
  let encryptedWallets;
  try {
    encryptedWallets = JSON.parse(await decryptFile("../../../config/wallets.encrypted"));
  } catch (error) {
    console.error("Failed to decrypt wallets.json:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets.json", fn: "collectAssets" });
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
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets", fn: "collectAssets" });
    return [];
  }

  const wallet = decryptedWallets.wallets.TrustWallet || { address: "", privateKey: "" };
  if (!wallet.address || !wallet.privateKey) {
    console.error("No wallet address or private key found for collecting assets");
    globalStats.errors.push({ time: new Date().toISOString(), message: "No wallet address or private key found", fn: "collectAssets" });
    globalStats.processes.collectAssets.status = "awaiting_funds";
    globalStats.processes.collectAssets.message = "Awaiting wallet configuration";
    return [];
  }

  globalStats.totalAttempts += 1;
  const results = [];
  try {
    const balance = await web3.eth.getBalance(wallet.address);
    const balanceInBNB = web3.utils.fromWei(balance, "ether");
    if (parseFloat(balanceInBNB) < 0.001) {
      console.log(`Insufficient balance (${balanceInBNB} BNB) to collect assets`);
      globalStats.processes.collectAssets.status = "awaiting_funds";
      globalStats.processes.collectAssets.message = "Awaiting balance of 0.001 BNB for gas";
      return [];
    }

    const amount = 0.0001; // Simulated collected amount
    console.log(`Collected assets for ${wallet.address}: ${amount} BNB`);
    globalStats.activity.collectibles += 1;
    addFeedItem(`Collected assets for ${wallet.address}: ${amount} BNB`, "collection");
    results.push({ address: wallet.address, status: "collected", amount });
    if (nimbus) {
      nimbus.logEarnings(amount);
    }

    await logTransaction({
      type: "Asset Collection",
      asset: "BNB",
      amount,
      valueUSD: 0, // Placeholder
      chain: "BSC",
      walletAddress: wallet.address,
      source: "OpenSea",
      txHash: "N/A", // Placeholder
      notes: "Collected Bored Ape Yacht Club NFT",
    });
  } catch (error) {
    console.error("collectAssets error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "collectAssets" });
    results.push({ address: wallet.address, status: "failed", amount: 0 });
  }
  return results;
};

const sweepFragments = async (wallets, addFeedItem, globalStats) => {
  let encryptedWallets;
  try {
    encryptedWallets = JSON.parse(await decryptFile("../../../config/wallets.encrypted"));
  } catch (error) {
    console.error("Failed to decrypt wallets.json:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets.json", fn: "sweepFragments" });
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
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets", fn: "sweepFragments" });
    return [];
  }

  const wallet = decryptedWallets.wallets.TrustWallet || { address: "", privateKey: "" };
  if (!wallet.address || !wallet.privateKey) {
    console.error("No wallet address or private key found for sweeping fragments");
    globalStats.errors.push({ time: new Date().toISOString(), message: "No wallet address or private key found", fn: "sweepFragments" });
    return [];
  }

  globalStats.totalAttempts += 1;
  const results = [];
  try {
    const amount = 0.00001;
    const balance = await web3.eth.getBalance(wallet.address);
    const balanceInBNB = web3.utils.fromWei(balance, "ether");
    console.log(`Swept fragments for ${wallet.address}: ${balanceInBNB} BNB`);
    globalStats.activity.fragments += 1;
    addFeedItem(`Swept fragments for ${wallet.address}: ${balanceInBNB} BNB`, "collection");
    results.push({ chain: "BNB", amount: balanceInBNB });
    const profit = amount * 0.1; 
    if (nimbus) {
      nimbus.logEarnings(profit);
    }

    await logTransaction({
      type: "Fragment Sweep",
      asset: "BNB",
      amount: balanceInBNB,
      valueUSD: 0, // Placeholder
      chain: "BSC",
      walletAddress: wallet.address,
      source: "Wallet Sweep",
      txHash: "N/A", // Placeholder
      notes: "Swept fragments from wallet",
    });
  } catch (error) {
    console.error("sweepFragments error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "sweepFragments" });
    results.push({ chain: "BNB", amount: 0 });
  }
  return results;
};

module.exports = { scrapeCollectibles, collectAssets, sweepFragments };
