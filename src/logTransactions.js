const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs").promises;

const logTransaction = async (transaction) => {
  const year = new Date().getFullYear();
  const filePath = path.join(__dirname, `../logs/transactions_${year}.xlsx`);

  const workbook = new ExcelJS.Workbook();
  let worksheet;

  // Check if the file exists
  try {
    await fs.access(filePath);
    await workbook.xlsx.readFile(filePath);
    worksheet = workbook.getWorksheet("Transactions") || workbook.addWorksheet("Transactions");
  } catch (error) {
    worksheet = workbook.addWorksheet("Transactions");
    // Define columns
    worksheet.columns = [
      { header: "Timestamp", key: "timestamp", width: 20 },
      { header: "Type", key: "type", width: 15 },
      { header: "Asset", key: "asset", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Value (USD)", key: "valueUSD", width: 15 },
      { header: "Chain", key: "chain", width: 10 },
      { header: "Wallet Address", key: "walletAddress", width: 40 },
      { header: "Source", key: "source", width: 20 },
      { header: "Transaction Hash", key: "txHash", width: 40 },
      { header: "Notes", key: "notes", width: 30 },
    ];
  }

  // Add the transaction
  worksheet.addRow({
    timestamp: new Date().toISOString(),
    type: transaction.type || "Unknown",
    asset: transaction.asset || "N/A",
    amount: transaction.amount || 0,
    valueUSD: transaction.valueUSD || 0,
    chain: transaction.chain || "N/A",
    walletAddress: transaction.walletAddress || "N/A",
    source: transaction.source || "N/A",
    txHash: transaction.txHash || "N/A",
    notes: transaction.notes || "",
  });

  // Save the file
  await workbook.xlsx.writeFile(filePath);
  console.log(`Logged transaction to ${filePath}`);
};

module.exports = { logTransaction };
