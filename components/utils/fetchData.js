const axios = require("axios");

const fetchData = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch data from ${url}: ${error.message}`);
  }
};

module.exports = { fetchData };
