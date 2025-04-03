const { fetchData, saveData } = require("./utils");
const config = require("../config/config.json");

const scrapeCoins = async () => {
  const data = await fetchData(config.sources.coingecko);
  if (data) {
    saveData("./data/altcoins.json", data);
    console.log("Scraped altcoins:", data.length);
  }
};

const startScraping = () => {
  scrapeCoins();
  setInterval(scrapeCoins, config.scrapeInterval);
};

module.exports = { startScraping };
