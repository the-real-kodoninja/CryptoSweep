const fs = require("fs").promises;

const saveData = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${filePath}`);
  } catch (error) {
    throw new Error(`Failed to save data to ${filePath}: ${error.message}`);
  }
};

module.exports = { saveData };
