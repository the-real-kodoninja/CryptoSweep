const fs = require("fs").promises;
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = crypto.scryptSync("superSecretPassword123", "salt", 32); // Replace with your password
const iv = crypto.randomBytes(16);

const encryptFile = async (inputPath, outputPath) => {
  try {
    const inputData = await fs.readFile(inputPath, "utf8");
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(inputData, "utf8", "hex");
    encrypted += cipher.final("hex");
    const encryptedData = { iv: iv.toString("hex"), encrypted };
    await fs.writeFile(outputPath, JSON.stringify(encryptedData, null, 2));
    console.log(`Encrypted ${inputPath} to ${outputPath}`);
  } catch (error) {
    console.error(`Error encrypting ${inputPath}:`, error.message);
  }
};

const encryptString = async (inputString, outputPath) => {
  try {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(inputString, "utf8", "hex");
    encrypted += cipher.final("hex");
    const encryptedData = { iv: iv.toString("hex"), encrypted };
    await fs.writeFile(outputPath, JSON.stringify(encryptedData, null, 2));
    console.log(`Encrypted string to ${outputPath}`);
  } catch (error) {
    console.error(`Error encrypting string:`, error.message);
  }
};

const decryptFile = async (inputPath) => {
  try {
    const encryptedData = JSON.parse(await fs.readFile(inputPath, "utf8"));
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(encryptedData.iv, "hex"));
    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error(`Error decrypting ${inputPath}:`, error.message);
    throw error;
  }
};

// Encrypt sensitive files and the dashboard password
(async () => {
  await encryptFile("components/superMiner/superMiner.js", "components/superMiner/superMiner.encrypted");
  await encryptFile("src/password.js", "src/password.encrypted");
  await encryptFile("config/wallets.json", "config/wallets.encrypted");
  await encryptString("xAI_Rules_2025", "config/password.encrypted");
})();

module.exports = { decryptFile };
