const LanguageModel = require("./languageModel");
const { decryptFile, encryptFile } = require("./encryptFiles");
const { decryptData } = require("./password");
const path = require("path");

let nimbusInstance = null;

const initializeNimbus = (globalStats, addFeedItem) => {
  if (nimbusInstance) {
    return nimbusInstance;
  }

  const updatePassword = async (newPassword) => {
    try {
      await encryptFile(newPassword, path.join(__dirname, "../config/password.encrypted"));
      globalStats.PASSWORD = newPassword;
      addFeedItem(`Password updated to ${newPassword}`, "system");
    } catch (error) {
      console.error("Failed to update password:", error.message);
      throw error;
    }
  };

  const addWallet = async (walletAddress) => {
    try {
      let encryptedWallets = JSON.parse(await decryptFile(path.join(__dirname, "../config/wallets.encrypted")));
      let decryptedWallets = decryptData(
        encryptedWallets.encrypted,
        encryptedWallets.iv,
        encryptedWallets.key,
        encryptedWallets.hash
      );
      decryptedWallets.wallets[walletAddress] = { address: walletAddress, privateKey: "placeholder" };
      await encryptFile(JSON.stringify(decryptedWallets), path.join(__dirname, "../config/wallets.encrypted"));
      addFeedItem(`Wallet ${walletAddress} added`, "system");
    } catch (error) {
      console.error("Failed to add wallet:", error.message);
      throw error;
    }
  };

  nimbusInstance = new LanguageModel(globalStats, addFeedItem, updatePassword, addWallet);
  return nimbusInstance;
};

const getNimbus = () => {
  if (!nimbusInstance) {
    throw new Error("Nimbus not initialized. Call initializeNimbus first.");
  }
  return nimbusInstance;
};

module.exports = { initializeNimbus, getNimbus };
