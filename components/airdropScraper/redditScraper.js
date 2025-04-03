const axios = require("axios");
const cheerio = require("cheerio");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");

const scrapeReddit = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const url = "https://www.reddit.com/r/CryptoAirdrops/";
  try {
    const data = await fetchData(url);
    const $ = cheerio.load(data);
    const airdrops = [];
    $("h3").each((i, el) => {
      const title = $(el).text();
      if (title.toLowerCase().includes("airdrop")) {
        airdrops.push({ title, link: "https://reddit.com" });
      }
    });
    console.log(`Scraped ${airdrops.length} airdrops from Reddit`);
    globalStats.activity.airdrops += airdrops.length;
    globalStats.sourceItems.Reddit += airdrops.length;
    addFeedItem(`Scraped ${airdrops.length} airdrops from Reddit`, "scrape");
    return airdrops;
  } catch (error) {
    console.error("scrapeReddit error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeReddit" });
    return [];
  }
};

module.exports = { scrapeReddit };
