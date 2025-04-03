const { ethers } = require("ethers");
const wallets = require("../config/wallets.json");

const generateWallets = (count) => {
  const newWallets = [];
  for (let i = 0; i < count; i++) {
    const wallet = ethers.Wallet.createRandom();
    newWallets.push({ address: wallet.address, privateKey: wallet.privateKey });
  }
  return newWallets;
};

const distributeAssets = (assets) => {
  console.log(`Distributing ${assets.length} assets to ${wallets.wallets.length} wallets`);
  // Placeholder: Add logic to send assets when you have funds
};

module.exports = { generateWallets, distributeAssets };
