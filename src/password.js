const crypto = require("crypto");
require("dotenv").config();

const algorithm = "aes-256-cbc";
const key = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, "hex") : crypto.randomBytes(32);
const iv = process.env.ENCRYPTION_IV ? Buffer.from(process.env.ENCRYPTION_IV, "hex") : crypto.randomBytes(16);

const encryptData = (data) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  const hash = crypto.createHash("sha256").update(encrypted).digest("hex");
  return { encrypted, iv: iv.toString("hex"), key: key.toString("hex"), hash };
};

const decryptData = (encryptedData, ivHex, keyHex, hash) => {
  const computedHash = crypto.createHash("sha256").update(encryptedData).digest("hex");
  if (computedHash !== hash) {
    throw new Error("Data integrity check failed: possible tampering detected");
  }
  const ivBuffer = Buffer.from(ivHex, "hex");
  const keyBuffer = Buffer.from(keyHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
};

const password = "xAI_Rules_2025";
const { encrypted, iv: encryptedIv, key: encryptedKey, hash } = encryptData(password);
const encryptedPasswordData = { encrypted, iv: encryptedIv, key: encryptedKey, hash };

module.exports = { encryptedPasswordData, decryptData, encryptData };
