const axios = require("axios");
const cheerio = require("cheerio");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");

const scrapeCharityDrops = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const url = "https://www.thegivingblock.com/donate";
  try {
    const data = await fetchData(url);
    const $ = cheerio.load(data);
    const drops = [];
    $("a[href*='campaign']").each((i, el) => {
      const title = $(el).text() || "No title";
      const link = $(el).attr("href") || "No link";
      drops.push({ title, link });
    });
    console.log(`Scraped ${drops.length} charity drops from The Giving Block`);
    globalStats.activity.charity += drops.length;
    globalStats.sourceItems.Charity += drops.length;
    addFeedItem(`Scraped ${drops.length} charity drops from The Giving Block`, "scrape");
    return drops;
  } catch (error) {
    console.error("scrapeCharityDrops error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeCharityDrops" });
    return [];
  }
};

module.exports = { scrapeCharityDrops };
