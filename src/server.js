const express = require("express");
const session = require("express-session");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { startScraping, stopScraping, globalStats } = require("./scraper");
const { decryptFile } = require("./encryptFiles");
const { initializeNimbus } = require("./nimbus");
require("dotenv").config();

const app = express();
const port = 3000;

// Decrypt the password at runtime
let PASSWORD;
(async () => {
  try {
    PASSWORD = await decryptFile(path.join(__dirname, "../config/password.encrypted"));
  } catch (error) {
    console.error("Failed to decrypt password:", error.message);
    PASSWORD = "defaultPassword123";
  }
})();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(
  session({
    secret: "9bd23961addabb0c2a963affdb121faa87e2d8927f7fb00fae5b138c499d24d3",
    resave: false,
    saveUninitialized: false,
  })
);

const feedItems = [];

const addFeedItem = (message, type) => {
  feedItems.push({ message, type, timestamp: new Date().toISOString() });
  if (feedItems.length > 100) feedItems.shift();
};

// Initialize Nimbus
globalStats.PASSWORD = PASSWORD;
const nimbus = initializeNimbus(globalStats, addFeedItem);

let scrapingInterval = null;

// Login route
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "the-real-kodoninja" && password === PASSWORD) {
    req.session.loggedIn = true;
    const sessionToken = uuidv4();
    req.session.sessionToken = sessionToken;
    req.session.username = username;
    res.redirect(`/dashboard?user=${username}&session=${sessionToken}`);
  } else {
    res.render("login", { error: "Invalid username or password" });
  }
});

// Dashboard route with token validation
app.get("/dashboard", (req, res) => {
  const { user, session } = req.query;
  if (
    req.session.loggedIn &&
    user === req.session.username &&
    session === req.session.sessionToken
  ) {
    res.render("dashboard", { globalStats, feedItems });
  } else {
    res.redirect("/login");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.post("/start", (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: "Unauthorized" });
  if (!scrapingInterval) {
    console.log("Starting scraping...");
    scrapingInterval = startScraping(addFeedItem, nimbus);
    res.json({ status: "Scraping started" });
  } else {
    res.json({ status: "Scraping already running" });
  }
});

app.post("/stop", (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: "Unauthorized" });
  if (scrapingInterval) {
    console.log("Stopping scraping...");
    stopScraping(scrapingInterval);
    scrapingInterval = null;
    res.json({ status: "Scraping stopped" });
  } else {
    res.json({ status: "Scraping not running" });
  }
});

// Nimbus Chat Endpoints
app.post("/nimbus/chat", async (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: "Unauthorized" });
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const response = await nimbus.processMessage(message);
    res.json({ response });
  } catch (error) {
    console.error("Error processing Nimbus message:", error.message);
    res.status(500).json({ error: "Failed to process message" });
  }
});

app.get("/nimbus/logs", (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: "Unauthorized" });
  const logs = nimbus.getChatLogs();
  res.json(logs);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
