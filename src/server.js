const express = require("express");
const { startScraping } = require("./scraper");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.get("/scrape", (req, res) => {
  startScraping();
  res.send("Scraping started!");
});

app.listen(port, () => {
  console.log(`DeFiScraper running on port ${port}`);
});
