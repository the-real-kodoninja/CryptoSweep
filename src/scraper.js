const axios = require("axios");
const cheerio = require("cheerio");
const tr = require("tor-request");
const { decryptFile } = require("./encryptFiles");
const path = require("path");

// Mock other scraper imports (we're removing social media scraping)
const { scrapeHackerOne } = require("../components/bugBountyScraper/hackerOneScraper");
const { scrapeCharityDrops } = require("../components/charityScraper/charityDropsScraper");
const { scrapeSnapshotDAO } = require("../components/daoScraper/snapshotScraper");
const { scrapeFaucets, claimFaucets } = require("../components/faucetScraper/faucetScraper");
const { scrapePancakeSwap } = require("../components/liquidityPoolScraper/pancakeSwapScraper");
const { scrapeCollectibles, collectAssets, sweepFragments } = require("../components/collector/collector");
const { tradeTokens } = require("../components/trader/trader");
const { sweepWallets, distributeAssets } = require("../components/walletManager/walletManager");
const { scrapeMetaverse, claimMetaverse } = require("../components/metaverseMiner/metaverseMiner");

// Decrypt and load superMiner.js at runtime
let superMine;
(async () => {
  try {
    const decryptedCode = await decryptFile(path.join(__dirname, "../components/superMiner/superMiner.encrypted"));
    const module = { exports: {} };
    eval(decryptedCode);
    superMine = module.exports.superMine;
  } catch (error) {
    console.error("Failed to decrypt superMiner.js:", error.message);
    superMine = async () => {
      console.log("Super Miner is encrypted and cannot be run without the correct password.");
      return [];
    };
  }
})();

const globalStats = {
  totalAttempts: 0,
  activity: { airdrops: 0, bounties: 0, charity: 0, proposals: 0, faucets: 0, farming: 0, collectibles: 0, fragments: 0, trades: 0, mined: 0 },
  sourceItems: { Aggregators: 0, Metaverse: 0 }, // Added Metaverse
  collected: [],
  errors: [],
  processes: {
    scrapeAggregators: { status: "idle", message: "" },
    scrapeMetaverse: { status: "idle", message: "" }, // Added
    scrapeHackerOne: { status: "idle", message: "" },
    scrapeCharityDrops: { status: "idle", message: "" },
    scrapeSnapshotDAO: { status: "idle", message: "" },
    scrapeFaucets: { status: "idle", message: "" },
    claimFaucets: { status: "idle", message: "" },
    scrapePancakeSwap: { status: "idle", message: "" },
    scrapeCollectibles: { status: "idle", message: "" },
    collectAssets: { status: "idle", message: "" },
    sweepFragments: { status: "idle", message: "" },
    tradeTokens: { status: "idle", message: "" },
    sweepWallets: { status: "idle", message: "" },
    distributeAssets: { status: "idle", message: "" },
    superMine: { status: "idle", message: "" },
  },
};

// List of aggregator sites to scrape
const aggregatorSites = [
  { name: "AirdropAlert", url: "https://airdropalert.com/" },
  { name: "CoinMarketCap", url: "https://coinmarketcap.com/airdrop/" },
  { name: "AirdropKing", url: "https://airdropking.io/" },
  { name: "FaucetPay", url: "https://faucetpay.io/" },
  { name: "Allcoins.pw", url: "https://allcoins.pw/" },
  { name: "FreeBitco.in", url: "https://freebitco.in/" },
  { name: "DeFiLlama", url: "https://defillama.com/" },
  { name: "CoinGecko", url: "https://www.coingecko.com/en/airdrops" },
  { name: "AirdropBob", url: "https://www.airdropbob.com/" },
  { name: "CryptoAirdrop", url: "https://cryptoairdrop.io/" },
];

// Random delay between 5-20 seconds
const randomDelay = () => Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000;

// Simulate a break (e.g., every 5 requests, pause for 1-2 minutes)
let requestCount = 0;
const takeBreak = async () => {
  requestCount += 1;
  if (requestCount % 5 === 0) {
    const breakTime = Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000; // 1-2 minutes
    console.log(`Taking a break for ${breakTime / 1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, breakTime));
  }
};

// Scrape aggregators using Tor for IP rotation
const scrapeAggregators = async (addFeedItem, globalStats) => {
  globalStats.processes.scrapeAggregators.status = "running";
  const results = {};

  for (const site of aggregatorSites) {
    try {
      console.log(`Scraping ${site.name}...`);

      // Use Tor to make the request
      const response = await new Promise((resolve, reject) => {
        tr.request(site.url, (err, res, body) => {
          if (err) return reject(err);
          resolve({ data: body });
        });
      });

      // Parse the HTML with Cheerio
      const $ = cheerio.load(response.data);
      const items = [];
      
      // Example: Extract airdrop links (adjust selectors based on site structure)
      $("a").each((i, elem) => {
        const href = $(elem).attr("href");
        const text = $(elem).text();
        if (href && text && (text.toLowerCase().includes("airdrop") || text.toLowerCase().includes("faucet"))) {
          items.push({ name: text, link: href });
        }
      });

      results[site.name] = items;
      globalStats.activity.airdrops += items.length;
      globalStats.sourceItems.Aggregators += items.length;
      addFeedItem(`Scraped ${items.length} items from ${site.name}`, "scrape");

      // Random delay to mimic human behavior
      await new Promise(resolve => setTimeout(resolve, randomDelay()));
      await takeBreak();
    } catch (error) {
      console.error(`Error scraping ${site.name}:`, error.message);
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: `scrapeAggregators-${site.name}` });
      results[site.name] = [];
    }
  }

  globalStats.processes.scrapeAggregators.status = "idle";
  return results;
};

const startScraping = (addFeedItem) => {
  const interval = setInterval(async () => {
    console.log("Scraping cycle started...");

    // Scrape Aggregators
    globalStats.processes.scrapeAggregators.status = "running";
    const aggregatorResults = await scrapeAggregators(addFeedItem, globalStats);
    globalStats.processes.scrapeAggregators.status = "idle";

    // Bug Bounty Scraper
    globalStats.processes.scrapeHackerOne.status = "running";
    const hackerOneBounties = await scrapeHackerOne(addFeedItem, globalStats);
    globalStats.processes.scrapeHackerOne.status = "idle";

    // Charity Scraper
    globalStats.processes.scrapeCharityDrops.status = "running";
    const charityDrops = await scrapeCharityDrops(addFeedItem, globalStats);
    globalStats.processes.scrapeCharityDrops.status = "idle";

    // DAO Scraper
    globalStats.processes.scrapeSnapshotDAO.status = "running";
    const daoProposals = await scrapeSnapshotDAO(addFeedItem, globalStats);
    globalStats.processes.scrapeSnapshotDAO.status = "idle";

    // Faucet Scraper
    globalStats.processes.scrapeFaucets.status = "running";
    const faucets = await scrapeFaucets(addFeedItem, globalStats);
    globalStats.processes.scrapeFaucets.status = "idle";

    globalStats.processes.claimFaucets.status = "running";
    const claimedFaucets = await claimFaucets({}, addFeedItem, globalStats);
    globalStats.processes.claimFaucets.status = "idle";

    // Liquidity Pool Scraper
    globalStats.processes.scrapePancakeSwap.status = "running";
    const pancakeSwapFarms = await scrapePancakeSwap(addFeedItem, globalStats);
    globalStats.processes.scrapePancakeSwap.status = "idle";

    // Collectibles Scraper
    globalStats.processes.scrapeCollectibles.status = "running";
    const collectibles = await scrapeCollectibles(addFeedItem, globalStats);
    globalStats.processes.scrapeCollectibles.status = "idle";

    globalStats.processes.collectAssets.status = "running";
    const collectedAssets = await collectAssets({}, addFeedItem, globalStats);
    globalStats.processes.collectAssets.status = "idle";

    globalStats.processes.sweepFragments.status = "running";
    const sweptFragments = await sweepFragments({}, addFeedItem, globalStats);
    globalStats.processes.sweepFragments.status = "idle";

    // Trading
    globalStats.processes.tradeTokens.status = "running";
    await tradeTokens("BNB", "CAKE", 0.01, {}, addFeedItem, globalStats);
    globalStats.processes.tradeTokens.status = "idle";

    // Wallet Management
    globalStats.processes.sweepWallets.status = "running";
    const walletBalances = await sweepWallets(addFeedItem, globalStats);
    globalStats.processes.sweepWallets.status = "idle";

    globalStats.processes.distributeAssets.status = "running";
    await distributeAssets(collectedAssets, addFeedItem, globalStats);
    globalStats.processes.distributeAssets.status = "idle";

    // Super Miner
    globalStats.processes.superMine.status = "running";
    const minedAltcoins = await superMine(addFeedItem, globalStats);
    globalStats.processes.superMine.status = "idle";
    
   // Metaverse
   globalStats.processes.scrapeMetaverse.status = "running";
   const metaverseResults = await scrapeMetaverse(addFeedItem, globalStats);
   globalStats.processes.scrapeMetaverse.status = "idle";

   const metaverseClaims = await claimMetaverse({}, addFeedItem, globalStats);

    console.log("Scraping cycle completed.");
  }, 60000); // Run every 60 seconds

  return interval;
};

const stopScraping = (interval) => {
  clearInterval(interval);
  console.log("Scraping stopped.");
};

module.exports = { startScraping, stopScraping, globalStats };
