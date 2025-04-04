const axios = require("axios");

class Integrations {
  constructor() {
    this.platforms = {
      KodoTrading: "https://kodotrading.example.com/api",
      Kodoninja: "https://kodoninja.example.com/api",
      StopLoss: "https://stoploss.example.com/api",
      CelebrityCrush: "https://celebritycrush.example.com/api",
    };
  }

  async fetchData(platformName, endpoint) {
    const baseUrl = this.platforms[platformName];
    if (!baseUrl) throw new Error(`Platform ${platformName} not supported`);

    try {
      const response = await axios.get(`${baseUrl}/${endpoint}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from ${platformName}:`, error.message);
      return null;
    }
  }

  // Example: Fetch trading data from KodoTrading
  async getTradingData() {
    return this.fetchData("KodoTrading", "trades");
  }

  // Example: Fetch user data from Kodoninja
  async getUserData() {
    return this.fetchData("Kodoninja", "user");
  }

  // Example: Fetch stop-loss settings
  async getStopLossSettings() {
    return this.fetchData("StopLoss", "settings");
  }

  // Example: Fetch celebrity data
  async getCelebrityData() {
    return this.fetchData("CelebrityCrush", "celebrities");
  }
}

module.exports = Integrations;
