const LanguageModel = require("./languageModel");

const lm = new LanguageModel();

const text = "I love using DeFiScraper to find awesome airdrops!";
console.log("Tokens:", lm.tokenize(text));
console.log("Sentiment:", lm.analyzeSentiment(text));
console.log("Keywords:", lm.extractKeywords(text));
