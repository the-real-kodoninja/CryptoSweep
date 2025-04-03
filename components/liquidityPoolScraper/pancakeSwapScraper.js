const axios = require("axios");
const cheerio = require("cheerio");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");

const scrapePancakeSwap = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const url = "https://pancakeswap.finance/farms";
  try {
    const data = await fetchData(url);
    const $ = cheerio.load(data);
    const farms = [];
    $("div[class*='farm']").each((i, el) => {
      const title = $(el).text() || "No title";
      farms.push({ title });
    });
    console.log(`Scraped ${farms.length} farms from PancakeSwap`);
    globalStats.activity.farming += farms.length;
    globalStats.sourceItems.PancakeSwap += farms.length;
    addFeedItem(`Scraped ${farms.length} farms from PancakeSwap`, "scrape");
    return farms;
  } catch (error) {
    console.error("scrapePancakeSwap error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapePancakeSwap" });
    return [];
  }
};

module.exports = { scrapePancakeSwap };
