const axios = require("axios");
const cheerio = require("cheerio");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");

const scrapeX = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const url = "https://twitter.com/search?q=crypto%20airdrop%20free%20claim%20-filter:links%20lang:en&src=typed_query";
  try {
    const data = await fetchData(url);
    const $ = cheerio.load(data);
    const airdrops = [];
    $("article").each((i, el) => {
      const text = $(el).text();
      if (text.toLowerCase().includes("airdrop")) {
        airdrops.push({ title: text.substring(0, 50), link: "https://x.com" });
      }
    });
    console.log(`Scraped ${airdrops.length} airdrops from X`);
    globalStats.activity.airdrops += airdrops.length;
    globalStats.sourceItems.Twitter += airdrops.length;
    addFeedItem(`Scraped ${airdrops.length} airdrops from X`, "scrape");
    return airdrops;
  } catch (error) {
    console.error("scrapeX error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeX" });
    return [];
  }
};

module.exports = { scrapeX };
