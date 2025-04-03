const axios = require("axios");
const cheerio = require("cheerio");
const Web3 = require("web3");
const { decryptData } = require("../../password");

const web3 = new Web3("https://bsc-dataseed.binance.org/");
const GAS_THRESHOLD = web3.utils.toWei("0.001", "ether"); // 0.001 BNB for gas

const getWallets = () => {
  const encryptedWallets = require("../../config/wallets.json");
  return decryptData(encryptedWallets.encrypted, encryptedWallets.iv, encryptedWallets.key, encryptedWallets.hash);
};

const collectSources = [
  { name: "HackerOneBounties", url: "https://hackerone.com/bug-bounty-programs", selector: "a[href*='program']" },
  { name: "PancakeSwapFarms", url: "https://pancakeswap.finance/farms", selector: "div[class*='farm']" },
  { name: "InstagramChallenges", url: "https://www.instagram.com/explore/tags/cryptochallenge/", selector: "a[href*='post']" },
  { name: "SnapshotDAO", url: "https://snapshot.org/#/proposals", selector: "a[href*='proposal']" },
  { name: "CharityDrops", url: "https://www.thegivingblock.com/donate", selector: "a[href*='campaign']" },
];

const scrapeCollectibles = async (addFeedItem, globalStats) => {
  const results = {};
  for (const source of collectSources) {
    try {
      const { data } = await axios.get(source.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const $ = cheerio.load(data);
      const items = [];
      $(source.selector).each((i, el) => {
        const title = $(el).text() || "No title";
        const link = $(el).attr("href") || "No link";
        items.push({ title, link });
      });
      results[source.name] = items;
      console.log(`Scraped ${items.length} collectibles from ${source.name}`);
      addFeedItem(`Scraped ${items.length} collectibles from ${source.name}`, "scrape");
    } catch (error) {
      console.error(`Error scraping collectibles from ${source.name}: ${error.message}`);
      results[source.name] = [];
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: `scrapeCollectibles-${source.name}` });
    }
  }
  return results;
};

const collectAssets = async (wallets, addFeedItem, globalStats) => {
  const walletsData = getWallets();
  const wallet = walletsData.wallets.TrustWallet;
  const results = {};

  const balance = await web3.eth.getBalance(wallet.address);
  if (parseFloat(balance) < GAS_THRESHOLD) {
    globalStats.processes.collectAssets.status = "awaiting_funds";
    globalStats.processes.collectAssets.message = `Awaiting balance of ${web3.utils.fromWei(GAS_THRESHOLD, "ether")} BNB for gas`;
    return results;
  }

  // Placeholder for real collection (e.g., PancakeSwap farm rewards)
  // You’ll need to integrate with PancakeSwap’s smart contract to claim rewards
  results.TrustWallet = { BNB: 0.0005 }; // Simulate for now
  console.log(`Collected 0.0005 BNB from TrustWallet (placeholder)`);
  addFeedItem(`Collected 0.0005 BNB from TrustWallet (placeholder)`, "collection");
  return results;
};

const sweepFragments = async (wallets, addFeedItem, globalStats) => {
  const walletsData = getWallets();
  const wallet = walletsData.wallets.TrustWallet;
  const results = {};

  const balance = await web3.eth.getBalance(wallet.address);
  if (parseFloat(balance) < GAS_THRESHOLD) {
    globalStats.processes.sweepFragments.status = "awaiting_funds";
    globalStats.processes.sweepFragments.message = `Awaiting balance of ${web3.utils.fromWei(GAS_THRESHOLD, "ether")} BNB for gas`;
    return results;
  }

  // Placeholder for real fragment sweeping
  results.TrustWallet = { BNB: 0.0002, ETH: 0 };
  console.log(`Swept 0.0002 BNB fragments from TrustWallet (placeholder)`);
  addFeedItem(`Swept 0.0002 BNB fragments from TrustWallet (placeholder)`, "collection");
  return results;
};

module.exports = { scrapeCollectibles, collectAssets, sweepFragments };
