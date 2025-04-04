const natural = require("natural");

class LanguageModel {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");
  }

  // Tokenize text (e.g., break a sentence into words)
  tokenize(text) {
    return this.tokenizer.tokenize(text);
  }

  // Analyze sentiment (e.g., positive, negative, neutral)
  analyzeSentiment(text) {
    const tokens = this.tokenize(text);
    const sentimentScore = this.sentimentAnalyzer.getSentiment(tokens);
    if (sentimentScore > 0) return "positive";
    if (sentimentScore < 0) return "negative";
    return "neutral";
  }

  // Extract keywords (basic implementation)
  extractKeywords(text) {
    const tokens = this.tokenize(text);
    const stopwords = new Set(natural.stopwords);
    return tokens.filter(token => !stopwords.has(token.toLowerCase()) && token.length > 3);
  }
}

module.exports = LanguageModel;
