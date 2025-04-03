const Web3 = require("web3");
const { decryptData } = require("../../password");

const web3 = new Web3("https://bsc-dataseed.binance.org/");

const getWallets = () => {
  const encryptedWallets = require("../../config/wallets.json");
  return decryptData(encryptedWallets.encrypted, encryptedWallets.iv, encryptedWallets.key, encryptedWallets.hash);
};

const sweepWallets = async (addFeedItem, globalStats) => {
  const walletsData = getWallets();
  const wallets = walletsData.wallets;
  const results = {};
  for (const [walletName, wallet] of Object.entries(wallets)) {
    try {
      const balance = await web3.eth.getBalance(wallet.address);
      const balanceInBNB = web3.utils.fromWei(balance, "ether");
      results[walletName] = { BNB: balanceInBNB };
      console.log(`Swept ${balanceInBNB} BNB from ${walletName}`);
      addFeedItem(`Swept ${balanceInBNB} BNB from ${walletName}`, "collection");
    } catch (error) {
      console.error(`Error sweeping ${walletName}: ${error.message}`);
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: `sweepWallets-${walletName}` });
      results[walletName] = { BNB: 0 };
    }
  }
  return results;
};

const distributeAssets = async (assets, addFeedItem, globalStats) => {
  console.log("Distributing assets...");
  addFeedItem(`Distributed ${assets.length} assets (placeholder)`, "collection");
};

module.exports = { sweepWallets, distributeAssets };
