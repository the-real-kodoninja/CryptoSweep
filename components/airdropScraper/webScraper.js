const axios = require("axios");
const cheerio = require("cheerio");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");

const sources = [
  { name: "AirdropAlert", url: "https://airdropalert.com", selector: "a[href*='airdrop']" },
  { name: "CoinAirdrops", url: "https://coinairdrops.com", selector: "a[href*='airdrop']" },
];

const scrapeWeb = async (addFeedItem, globalStats) => {
  const results = {};
  for (const source of sources) {
    globalStats.totalAttempts += 1;
    try {
      const data = await fetchData(source.url);
      const $ = cheerio.load(data);
      const airdrops = [];
      $(source.selector).each((i, el) => {
        const title = $(el).text() || "No title";
        const link = $(el).attr("href") || "No link";
        airdrops.push({ title, link });
      });
      results[source.name] = airdrops;
      console.log(`Scraped ${airdrops.length} airdrops from ${source.name}`);
      globalStats.activity.airdrops += airdrops.length;
      addFeedItem(`Scraped ${airdrops.length} airdrops from ${source.name}`, "scrape");
    } catch (error) {
      console.error(`scrapeWeb error (${source.name}):`, error.message);
      globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: `scrapeWeb-${source.name}` });
      results[source.name] = [];
    }
  }
  return results;
};

module.exports = { scrapeWeb };
