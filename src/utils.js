const axios = require("axios");
const fs = require("fs");

const fetchData = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}: ${error.message}`);
    return null;
  }
};

const saveData = (filename, data) => {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
};

module.exports = { fetchData, saveData };
