const axios = require("axios");
const cheerio = require("cheerio");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");

const scrapeSnapshotDAO = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const url = "https://snapshot.org/#/proposals";
  try {
    const data = await fetchData(url);
    const $ = cheerio.load(data);
    const proposals = [];
    $("a[href*='proposal']").each((i, el) => {
      const title = $(el).text() || "No title";
      const link = $(el).attr("href") || "No link";
      proposals.push({ title, link });
    });
    console.log(`Scraped ${proposals.length} proposals from Snapshot DAO`);
    globalStats.activity.proposals += proposals.length;
    globalStats.sourceItems.Snapshot += proposals.length;
    addFeedItem(`Scraped ${proposals.length} proposals from Snapshot DAO`, "scrape");
    return proposals;
  } catch (error) {
    console.error("scrapeSnapshotDAO error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeSnapshotDAO" });
    return [];
  }
};

module.exports = { scrapeSnapshotDAO };
