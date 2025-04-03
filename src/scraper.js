const { fetchData } = require("../components/utils/fetchData");
const { saveData } = require("../components/utils/saveData");
const { scrapeX } = require("../components/airdropScraper/xScraper");
const { scrapeReddit } = require("../components/airdropScraper/redditScraper");
const { scrapeWeb } = require("../components/airdropScraper/webScraper");
const { scrapeHackerOne } = require("../components/bugBountyScraper/hackerOneScraper");
const { scrapePancakeSwap } = require("../components/liquidityPoolScraper/pancakeSwapScraper");
const { scrapeInstagramChallenges } = require("../components/socialMediaScraper/instagramScraper");
const { scrapeSnapshotDAO } = require("../components/daoScraper/snapshotScraper");
const { scrapeCharityDrops } = require("../components/charityScraper/charityDropsScraper");
const { scrapeFaucets, claimFaucets } = require("../components/faucetScraper/faucetScraper");
const { scrapeCollectibles, collectAssets, sweepFragments } = require("../components/collector/collector");
const { sweepWallets, distributeAssets } = require("../components/walletManager/walletManager");
const { tradeTokens } = require("../components/trader/trader");
const config = require("../config/config.json");

const TRADE_THRESHOLD = 0.01;
const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";

global.stats = {
  total: 0,
  hourly: 0,
  daily: 0,
  weekly: 0,
  monthly: 0,
  expected: { day: 0, week: 0, year: 0 },
  collected: [],
  wallets: [],
  altcoins: [],
  nfts: [],
  sources: [],
  activity: { airdrops: 0, faucets: 0, fragments: 0, collectibles: 0, bounties: 0, farming: 0, challenges: 0, proposals: 0, charity: 0 },
  sourceItems: { Reddit: 0, Twitter: 0, Faucets: 0, Jobs: 0, HackerOne: 0, PancakeSwap: 0, Instagram: 0, Snapshot: 0, Charity: 0 },
  successRate: 0,
  avgYield: 0,
  totalAttempts: 0,
  successfulAttempts: 0,
  errors: [],
  feed: [],
  systemStatus: "running",
  processes: {
    scrapeCoins: { status: "idle", lastRun: null, message: "" },
    scrapeX: { status: "idle", lastRun: null, message: "" },
    scrapeReddit: { status: "idle", lastRun: null, message: "" },
    scrapeHackerOne: { status: "idle", lastRun: null, message: "" },
    scrapePancakeSwap: { status: "idle", lastRun: null, message: "" },
    scrapeInstagramChallenges: { status: "idle", lastRun: null, message: "" },
    scrapeSnapshotDAO: { status: "idle", lastRun: null, message: "" },
    scrapeCharityDrops: { status: "idle", lastRun: null, message: "" },
    scrapeWeb: { status: "idle", lastRun: null, message: "" },
    scrapeFaucets: { status: "idle", lastRun: null, message: "" },
    scrapeCollectibles: { status: "idle", lastRun: null, message: "" },
    claimFaucets: { status: "idle", lastRun: null, message: "" },
    collectAssets: { status: "idle", lastRun: null, message: "" },
    sweepFragments: { status: "idle", lastRun: null, message: "" },
    sweepWallets: { status: "idle", lastRun: null, message: "" },
    distributeAssets: { status: "idle", lastRun: null, message: "" },
    tradeTokens: { status: "idle", lastRun: null, message: "" },
  },
};

const addFeedItem = (message, type) => {
  global.stats.feed.unshift({
    timestamp: new Date().toISOString(),
    message,
    type,
  });
  global.stats.feed = global.stats.feed.slice(0, 50);
};

const updateProcessStatus = (processName, status, message = "") => {
  global.stats.processes[processName].status = status;
  global.stats.processes[processName].lastRun = new Date().toISOString();
  global.stats.processes[processName].message = message;
};

const retry = async (fn, processName, retries = 3, delay = 1000) => {
  updateProcessStatus(processName, "running");
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      updateProcessStatus(processName, "idle");
      return result;
    } catch (error) {
      if (i === retries - 1) {
        global.stats.errors.push({ time: new Date().toISOString(), message: error.message, fn: processName });
        addFeedItem(`Error in ${processName}: ${error.message}`, "error");
        updateProcessStatus(processName, "error", error.message);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const scrapeCoins = async () => {
  global.stats.totalAttempts += 1;
  try {
    const data = await retry(() => fetchData(config.sources.coingecko), "scrapeCoins");
    if (data) {
      global.stats.successfulAttempts += 1;
      saveData("./data/altcoins.json", data);
      console.log("Scraped altcoins:", data.length);
      global.stats.sources.push({ time: new Date().toISOString(), name: "CoinGecko", item: `${data.length} altcoins` });
      addFeedItem(`Scraped ${data.length} altcoins from CoinGecko`, "scrape");
      return data;
    }
    return [];
  } catch (error) {
    console.error("scrapeCoins error:", error.message);
    global.stats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeCoins" });
    return [];
  }
};

const scrapeAll = async () => {
  try {
    global.stats.systemStatus = "running";
    const coins = await scrapeCoins();
    const airdropsX = await retry(() => scrapeX(addFeedItem, global.stats), "scrapeX");
    const airdropsReddit = await retry(() => scrapeReddit(addFeedItem, global.stats), "scrapeReddit");
    const hackerOneBounties = await retry(() => scrapeHackerOne(addFeedItem, global.stats), "scrapeHackerOne");
    const pancakeSwapFarms = await retry(() => scrapePancakeSwap(addFeedItem, global.stats), "scrapePancakeSwap");
    const instagramChallenges = await retry(() => scrapeInstagramChallenges(addFeedItem, global.stats), "scrapeInstagramChallenges");
    const snapshotProposals = await retry(() => scrapeSnapshotDAO(addFeedItem, global.stats), "scrapeSnapshotDAO");
    const charityDrops = await retry(() => scrapeCharityDrops(addFeedItem, global.stats), "scrapeCharityDrops");
    const webAirdrops = await retry(() => scrapeWeb(addFeedItem, global.stats), "scrapeWeb");
    const faucets = await retry(() => scrapeFaucets(addFeedItem, global.stats), "scrapeFaucets");
    const collectibles = await retry(() => scrapeCollectibles(addFeedItem, global.stats), "scrapeCollectibles");
    const claims = await retry(() => claimFaucets({}, addFeedItem, global.stats), "claimFaucets");
    const collected = await retry(() => collectAssets({}, addFeedItem, global.stats), "collectAssets");
    const fragments = await retry(() => sweepFragments({}, addFeedItem, global.stats), "sweepFragments");
    const balances = await retry(() => sweepWallets(addFeedItem, global.stats), "sweepWallets");
    await retry(() =>
      distributeAssets(
        [
          ...coins,
          ...airdropsX,
          ...airdropsReddit,
          ...hackerOneBounties,
          ...pancakeSwapFarms,
          ...instagramChallenges,
          ...snapshotProposals,
          ...charityDrops,
          ...Object.values(webAirdrops).flat(),
          ...faucets,
          ...Object.values(collectibles).flat(),
          ...Object.values(fragments).flatMap(obj => Object.entries(obj).map(([chain, amount]) => ({ chain, amount }))),
        ],
        addFeedItem,
        global.stats
      ),
      "distributeAssets"
    );

    global.stats.wallets = [];
    global.stats.altcoins = [];
    for (const [name, chains] of Object.entries(balances)) {
      for (const [chain, balance] of Object.entries(chains)) {
        global.stats.wallets.push({ name, chain, balance: balance || 0 });
        global.stats.altcoins.push({ symbol: chain, amount: balance || 0, source: "Wallet Sweep" });
        addFeedItem(`Swept ${balance || 0} ${chain} from ${name}`, "collection");
      }
    }

    global.stats.successRate = global.stats.totalAttempts > 0 ? (global.stats.successfulAttempts / global.stats.totalAttempts) * 100 : 0;
    global.stats.avgYield = global.stats.sources.length > 0 ? (global.stats.total / global.stats.sources.length) : 0;

    const trustWallet = balances.TrustWallet;
    if (trustWallet && parseFloat(trustWallet.BNB || 0) >= TRADE_THRESHOLD) {
      console.log(`BNB balance ${trustWallet.BNB} >= ${TRADE_THRESHOLD} - starting trade`);
      await retry(() => tradeTokens(BUSD, CAKE, web3.utils.toWei(TRADE_THRESHOLD.toString(), "ether"), null, null, addFeedItem, global.stats), "tradeTokens");
    }
  } catch (error) {
    console.error("scrapeAll error:", error.message);
    global.stats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeAll" });
    global.stats.systemStatus = "stopped";
  }
};

const startScraping = () => {
  const runScraping = async () => {
    try {
      await scrapeAll();
    } catch (error) {
      console.error("Scraping loop error:", error.message);
      global.stats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "startScraping" });
      global.stats.systemStatus = "stopped";
    }
  };

  runScraping();
  setInterval(runScraping, config.scrapeInterval);
};

module.exports = { startScraping };
