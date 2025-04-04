const { Web3 } = require("web3");
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

const web3 = new Web3("https://bsc-dataseed.binance.org/");

const tradeTokens = async (tokenA, tokenB, amount, wallet, addFeedItem, globalStats) => {
  let encryptedWallets;
  try {
    encryptedWallets = JSON.parse(await decryptFile("../../../config/wallets.encrypted"));
  } catch (error) {
    console.error("Failed to decrypt wallets.json:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets.json", fn: "tradeTokens" });
    return;
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
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets", fn: "tradeTokens" });
    return;
  }

  const walletData = decryptedWallets.wallets.TrustWallet || { address: "", privateKey: "" };
  if (!walletData.address || !walletData.privateKey) {
    console.error("No wallet address or private key found for trading tokens");
    globalStats.errors.push({ time: new Date().toISOString(), message: "No wallet address or private key found", fn: "tradeTokens" });
    globalStats.processes.tradeTokens.status = "awaiting_funds";
    globalStats.processes.tradeTokens.message = "Awaiting wallet configuration";
    return;
  }

  globalStats.totalAttempts += 1;
  try {
    const balance = await web3.eth.getBalance(walletData.address);
    const balanceInBNB = web3.utils.fromWei(balance, "ether");
    if (parseFloat(balanceInBNB) < 0.001) {
      console.log(`Insufficient balance (${balanceInBNB} BNB) to trade tokens`);
      globalStats.processes.tradeTokens.status = "awaiting_funds";
      globalStats.processes.tradeTokens.message = "Awaiting balance of 0.001 BNB for gas";
      return;
    }

    const amountReceived = amount * 0.95; // Simulated trade (5% slippage)
    console.log(`Traded ${amount} of token ${tokenA} for ${amountReceived} of token ${tokenB}`);
    globalStats.activity.trades += 1;
    addFeedItem(`Traded ${amount} of token ${tokenA} for ${amountReceived} of token ${tokenB}`, "trade");

    // Log the transaction
    await logTransaction({
      type: "Trade",
      asset: `${tokenA}/${tokenB}`,
      amount: amountReceived,
      valueUSD: 0, // Placeholder
      chain: "BSC",
      walletAddress: walletData.address,
      source: "PancakeSwap",
      txHash: "N/A", // Placeholder
      notes: `Traded ${amount} ${tokenA} for ${amountReceived} ${tokenB}`,
    });
  } catch (error) {
    console.error("tradeTokens error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "tradeTokens" });
  }
};

module.exports = { tradeTokens };
