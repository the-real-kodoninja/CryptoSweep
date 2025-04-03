const fs = require("fs").promises;
const { decryptData } = require("./password");

const decryptWallets = async () => {
  try {
    const encryptedWallets = require("../config/wallets.json");
    const decryptedWallets = decryptData(
      encryptedWallets.encrypted,
      encryptedWallets.iv,
      encryptedWallets.key,
      encryptedWallets.hash
    );
    console.log("Decrypted wallets.json:");
    console.log(JSON.stringify(decryptedWallets, null, 2));
  } catch (error) {
    console.error("Error decrypting wallets:", error.message);
  }
};

decryptWallets();
