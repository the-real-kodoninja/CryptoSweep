const axios = require("axios");
const cheerio = require("cheerio");
const { fetchData } = require("../utils/fetchData");
const { saveData } = require("../utils/saveData");

const scrapeInstagramChallenges = async (addFeedItem, globalStats) => {
  globalStats.totalAttempts += 1;
  const url = "https://www.instagram.com/explore/tags/cryptochallenge/";
  try {
    const data = await fetchData(url);
    const $ = cheerio.load(data);
    const challenges = [];
    $("a[href*='post']").each((i, el) => {
      const title = $(el).text() || "No title";
      const link = $(el).attr("href") || "No link";
      challenges.push({ title, link });
    });
    console.log(`Scraped ${challenges.length} challenges from Instagram`);
    globalStats.activity.challenges += challenges.length;
    globalStats.sourceItems.Instagram += challenges.length;
    addFeedItem(`Scraped ${challenges.length} challenges from Instagram`, "scrape");
    return challenges;
  } catch (error) {
    console.error("scrapeInstagramChallenges error:", error.message);
    globalStats.errors.push({ time: new Date().toISOString(), message: error.message, fn: "scrapeInstagramChallenges" });
    return [];
  }
};

module.exports = { scrapeInstagramChallenges };
