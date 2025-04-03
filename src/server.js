const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const csurf = require("csurf");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser"); // Add cookie-parser
const { startScraping } = require("./scraper");
const { encryptedPasswordData, decryptPassword } = require("./password");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Decrypt the password
const PASSWORD = decryptPassword(
  encryptedPasswordData.encrypted,
  encryptedPasswordData.iv,
  encryptedPasswordData.key
);

// Security middleware
app.use(helmet()); // Set security headers
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
  })
);

// Cookie parser middleware (required for csurf with cookie: true)
app.use(cookieParser());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000, secure: process.env.NODE_ENV === "production" }, // Secure cookie in production
  })
);

// CSRF protection
const csrfProtection = csurf({ cookie: true });
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);

// Middleware to check session activity
app.use((req, res, next) => {
  if (req.session.isAuthenticated) {
    req.session.touch();
    next();
  } else {
    next();
  }
});

// Pass CSRF token to views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.set("view engine", "ejs");
app.use(express.static("public"));

// Login route
app.get("/", (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect("/dashboard");
  }
  res.send(`
    <html>
      <head>
        <title>DeFiScraper Login</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="login-container">
          <h1>DeFiScraper</h1>
          <form action="/dashboard" method="POST">
            <input type="hidden" name="_csrf" value="${res.locals.csrfToken}" />
            <input type="password" name="password" placeholder="Enter Password" />
            <button type="submit">Login</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// Dashboard route with authentication check
app.post("/dashboard", (req, res) => {
  try {
    if (req.body.password === PASSWORD) {
      req.session.isAuthenticated = true;
      res.render("dashboard", { stats: global.stats || { total: 0, hourly: 0, daily: 0, weekly: 0, monthly: 0, expected: { day: 0, week: 0, year: 0 }, collected: [], wallets: [], altcoins: [], nfts: [], sources: [], activity: {}, sourceItems: {}, feed: [] } });
    } else {
      res.status(401).send("Wrong password! Try again.");
    }
  } catch (error) {
    console.error("Dashboard POST error:", error.message);
    res.status(500).send("Internal server error.");
  }
});

app.get("/dashboard", (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.redirect("/");
  }
  res.render("dashboard", { stats: global.stats || { total: 0, hourly: 0, daily: 0, weekly: 0, monthly: 0, expected: { day: 0, week: 0, year: 0 }, collected: [], wallets: [], altcoins: [], nfts: [], sources: [], activity: {}, sourceItems: {}, feed: [] } });
});

app.get("/scrape", (req, res) => {
  try {
    startScraping();
    res.send("Scraping started!");
  } catch (error) {
    console.error("Scrape endpoint error:", error.message);
    res.status(500).send("Failed to start scraping.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`DeFiScraper running on port ${port}`);
});
