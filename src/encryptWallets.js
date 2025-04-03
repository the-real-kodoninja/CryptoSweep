const fs = require("fs").promises;
const { encryptData } = require("./password");

const encryptWallets = async () => {
  try {
    const wallets = require("../config/wallets.json");
    const encryptedWallets = encryptData(wallets);
    await fs.writeFile("./config/wallets.json", JSON.stringify(encryptedWallets, null, 2));
    console.log("Wallets encrypted and saved to config/wallets.json");
  } catch (error) {
    console.error("Error encrypting wallets:", error.message);
  }
};

encryptWallets();
