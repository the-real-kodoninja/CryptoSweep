const axios = require("axios");
const cheerio = require("cheerio");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");

const scrapeHackerOne = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const url = "https://hackerone.com/bug-bounty-programs";
  try {
    const data = await fetchData(url);
    const $ = cheerio.load(data);
    const bounties = [];
    $("a[href*='program']").each((i, el) => {
      const title = $(el).text() || "No title";
      const link = $(el).attr("href") || "No link";
      bounties.push({ title, link });
    });
    console.log(`Scraped ${bounties.length} bounties from HackerOne`);
    globalStats.activity.bounties += bounties.length;
    globalStats.sourceItems.HackerOne += bounties.length;
    addFeedItem(`Scraped ${bounties.length} bounties from HackerOne`, "scrape");
    return bounties;
  } catch (error) {
    console.error("scrapeHackerOne error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeHackerOne" });
    return [];
  }
};

module.exports = { scrapeHackerOne };
