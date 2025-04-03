const puppeteer = require("puppeteer");
const { fetchData } = require("../utils/fetchData");
const { decryptData } = require("../../src/password");

const faucets = [
  { name: "Allcoins.pw", url: "https://allcoins.pw/faucet", selector: "input[name='address']", submit: "button[type='submit']" },
];

const scrapeFaucets = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const results = [];
  for (const faucet of faucets) {
    try {
      const data = await fetchData(faucet.url);
      results.push({ name: faucet.name, url: faucet.url });
      console.log(`Scraped faucet: ${faucet.name}`);
      globalStats.activity.faucets += 1;
      globalStats.sourceItems.Faucets += 1;
      addFeedItem(`Scraped faucet: ${faucet.name}`, "scrape");
    } catch (error) {
      console.error(`scrapeFaucets error (${faucet.name}):`, error.message);
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: `scrapeFaucets-${faucet.name}` });
    }
  }
  return results;
};

const claimFaucets = async (wallets, addFeedItem, globalStats) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];
  const encryptedWallets = require("../../../config/wallets.json");
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
    globalStats.errors.push({ time: new Date().toISOString(), message: "Failed to decrypt wallets", fn: "claimFaucets" });
    await browser.close();
    return [];
  }

  const wallet = decryptedWallets.wallets.TrustWallet || { address: "" };
  if (!wallet.address) {
    console.error("No wallet address found for claiming faucets");
    globalStats.errors.push({ time: new Date().toISOString(), message: "No wallet address found", fn: "claimFaucets" });
    await browser.close();
    return [];
  }

  for (const faucet of faucets) {
    globalStats.totalAttempts += 1;
    try {
      await page.goto(faucet.url, { waitUntil: "networkidle2" });
      await page.type(faucet.selector, wallet.address);
      await page.click(faucet.submit);
      await page.waitForNavigation({ timeout: 10000 });
      console.log(`Claimed faucet: ${faucet.name}`);
      globalStats.activity.faucets += 1;
      addFeedItem(`Claimed faucet: ${faucet.name}`, "collection");
      results.push({ name: faucet.name, status: "claimed" });
    } catch (error) {
      console.error(`claimFaucets error (${faucet.name}):`, error.message);
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: `claimFaucets-${faucet.name}` });
      results.push({ name: faucet.name, status: "failed" });
    }
  }
  await browser.close();
  return results;
};

module.exports = { scrapeFaucets, claimFaucets };
