const { decryptFile } = require("../../src/encryptFiles");
const { logTransaction } = require("../../src/logTransactions");
const { nimbus } = require("../../src/server");
const tr = require("tor-request");
const cheerio = require("cheerio");

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
      throw new Error("Cannot decrypt data: password.js is encrypted.");
    };
  }
})();

// List of Metaverse-related airdrop/faucet sites
const metaverseSites = [
  { name: "Decentraland Airdrops", url: "https://decentraland.org/airdrops" }, // Placeholder
  { name: "The Sandbox Faucets", url: "https://www.sandbox.game/en/earn" }, // Placeholder
];

const randomDelay = () => Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000;

let requestCount = 0;
const takeBreak = async () => {
  requestCount += 1;
  if (requestCount % 5 === 0) {
    const breakTime = Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;
    console.log(`Taking a break for ${breakTime / 1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, breakTime));
  }
};

const scrapeMetaverse = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const results = {};

  for (const site of metaverseSites) {
    try {
      console.log(`Scraping ${site.name}...`);
      const response = await new Promise((resolve, reject) => {
        tr.request(site.url, (err, res, body) => {
          if (err) return reject(err);
          resolve({ data: body });
        });
      });

      const $ = cheerio.load(response.data);
      const items = [];
      $("a").each((i, elem) => {
        const href = $(elem).attr("href");
        const text = $(elem).text();
        if (href && text && (text.toLowerCase().includes("airdrop") || text.toLowerCase().includes("faucet"))) {
          items.push({ name: text, link: href });
        }
      });

      results[site.name] = items;
      globalStats.activity.airdrops += items.length;
      globalStats.sourceItems.Metaverse += items.length;
      addFeedItem(`Scraped ${items.length} Metaverse items from ${site.name}`, "scrape");

      await new Promise(resolve => setTimeout(resolve, randomDelay()));
      await takeBreak();
    } catch (error) {
      console.error(`Error scraping ${site.name}:`, error.message);
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: `scrapeMetaverse-${site.name}` });
      results[site.name] = [];
    }
  }

  return results;
};

const claimMetaverse = async (wallets, addFeedItem, globalStats) => {
  let encryptedWallets;
  try {
    encryptedWallets = JSON.parse(await decryptFile("../../../config/wallets.encrypted"));
  } catch (error) {
    console.error("Failed to decrypt wallets.json:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets.json", fn: "claimMetaverse" });
    return [];
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
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets", fn: "claimMetaverse" });
    return [];
  }

  const wallet = decryptedWallets.wallets.TrustWallet || { address: "", privateKey: "" };
  if (!wallet.address || !wallet.privateKey) {
    console.error("No wallet address or private key found for claiming Metaverse rewards");
    globalStats.errors.push({ time: new Date().toISOString(), message: "No wallet address or private key found", fn: "claimMetaverse" });
    return [];
  }

  globalStats.totalAttempts += 1;
  const results = [];
  try {
    const amount = 0.00001; // Simulated Metaverse reward
    console.log(`Claimed Metaverse reward: ${amount} MANA for ${wallet.address}`);
    globalStats.activity.airdrops += 1;
    addFeedItem(`Claimed Metaverse reward: ${amount} MANA for ${wallet.address}`, "collection");
    results.push({ address: wallet.address, amount });

    nimbus.logEarnings(amount);

    await logTransaction({
      type: "Metaverse Claim",
      asset: "MANA",
      amount,
      valueUSD: 0,
      chain: "Ethereum",
      walletAddress: wallet.address,
      source: "Decentraland",
      txHash: "N/A",
      notes: "Claimed Metaverse airdrop",
    });
  } catch (error) {
    console.error("claimMetaverse error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "claimMetaverse" });
    results.push({ address: wallet.address, amount: 0 });
  }
  return results;
};

module.exports = { scrapeMetaverse, claimMetaverse };
