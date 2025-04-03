const fs = require("fs").promises;
const { decryptData, encryptData } = require("./password");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const manageWallets = async () => {
  try {
    // Decrypt the existing wallets
    const encryptedWallets = require("../config/wallets.json");
    let walletsData;
    try {
      walletsData = decryptData(
        encryptedWallets.encrypted,
        encryptedWallets.iv,
        encryptedWallets.key,
        encryptedWallets.hash
      );
    } catch (error) {
      console.log("No existing wallets found or decryption failed. Starting with an empty wallet list.");
      walletsData = { wallets: {} };
    }

    // Prompt user for action
    const action = await new Promise((resolve) => {
      readline.question("Do you want to (a)dd a wallet or (m)odify an existing wallet? (a/m): ", resolve);
    });

    if (action.toLowerCase() === "a") {
      // Add a new wallet
      const walletName = await new Promise((resolve) => {
        readline.question("Enter wallet name (e.g., TrustWallet): ", resolve);
      });
      const address = await new Promise((resolve) => {
        readline.question("Enter wallet address: ", resolve);
      });
      const privateKey = await new Promise((resolve) => {
        readline.question("Enter private key (optional, press Enter to skip): ", resolve);
      });

      walletsData.wallets[walletName] = {
        address,
        privateKey: privateKey || "",
      };
      console.log(`Added wallet: ${walletName}`);
    } else if (action.toLowerCase() === "m") {
      // Modify an existing wallet
      console.log("Current wallets:", Object.keys(walletsData.wallets));
      const walletName = await new Promise((resolve) => {
        readline.question("Enter the name of the wallet to modify: ", resolve);
      });

      if (!walletsData.wallets[walletName]) {
        console.log(`Wallet ${walletName} not found.`);
        readline.close();
        return;
      }

      const address = await new Promise((resolve) => {
        readline.question(`Enter new address for ${walletName} (current: ${walletsData.wallets[walletName].address}): `, resolve);
      });
      const privateKey = await new Promise((resolve) => {
        readline.question(`Enter new private key for ${walletName} (current: ${walletsData.wallets[walletName].privateKey || "none"}): `, resolve);
      });

      walletsData.wallets[walletName] = {
        address: address || walletsData.wallets[walletName].address,
        privateKey: privateKey || walletsData.wallets[walletName].privateKey,
      };
      console.log(`Modified wallet: ${walletName}`);
    } else {
      console.log("Invalid action. Please choose 'a' to add or 'm' to modify.");
      readline.close();
      return;
    }

    // Re-encrypt and save the updated wallets
    const encryptedWalletsUpdated = encryptData(walletsData);
    await fs.writeFile("./config/wallets.json", JSON.stringify(encryptedWalletsUpdated, null, 2));
    console.log("Wallets updated and re-encrypted in config/wallets.json");

    readline.close();
  } catch (error) {
    console.error("Error managing wallets:", error.message);
    readline.close();
  }
};

manageWallets();
