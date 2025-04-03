const Web3 = require("web3");
const { decryptData } = require("../../password");

const web3 = new Web3("https://bsc-dataseed.binance.org/");
const TRADE_THRESHOLD = web3.utils.toWei("0.01", "ether"); // 0.01 BNB

const getWallets = () => {
  const encryptedWallets = require("../../config/wallets.json");
  return decryptData(encryptedWallets.encrypted, encryptedWallets.iv, encryptedWallets.key, encryptedWallets.hash);
};

const tradeTokens = async (tokenA, tokenB, amount, wallet, privateKey, addFeedItem, globalStats) => {
  const walletsData = getWallets();
  const walletData = walletsData.wallets.TrustWallet;

  const balance = await web3.eth.getBalance(walletData.address);
  if (parseFloat(balance) < TRADE_THRESHOLD) {
    globalStats.processes.tradeTokens.status = "awaiting_funds";
    globalStats.processes.tradeTokens.message = `Awaiting balance of ${web3.utils.fromWei(TRADE_THRESHOLD, "ether")} BNB for trading`;
    return;
  }

  // Placeholder for real trading (e.g., using PancakeSwap router contract)
  console.log(`Trading ${web3.utils.fromWei(amount, "ether")} of ${tokenA} for ${tokenB}...`);
  addFeedItem(`Traded ${web3.utils.fromWei(amount, "ether")} of ${tokenA} for ${tokenB} (placeholder)`, "trade");
};

module.exports = { tradeTokens };
