require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886', // Twilio Sandbox number
  },

  llm: {
    primaryProvider: process.env.PRIMARY_LLM || 'gemini',

    // Google Gemini (Primary)
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    },

    // HuggingFace (Fallback)
    huggingface: {
      token: process.env.HF_TOKEN,
      model: process.env.HF_MODEL || 'meta-llama/Llama-3.3-70B-Instruct:novita',
      baseUrl: process.env.HF_BASE_URL || 'https://router.huggingface.co/v1',
    },

    temperature: 0.3,
    maxTokens: 1000,
  },

  chroma: {
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT) || 8000,
    collectionName: process.env.CHROMA_COLLECTION_NAME || 'fact_check_sources',
  },

  dataSources: {
    pibFactCheck: process.env.PIB_FACT_CHECK_URL || 'https://factcheck.pib.gov.in/',
    whoAdvisories: process.env.WHO_ADVISORIES_URL || 'https://www.who.int/emergencies/disease-outbreak-news',
    rssFeeds: process.env.RSS_FEEDS ? process.env.RSS_FEEDS.split(',') : [],
    newsDataApiKey: process.env.NEWSDATA_API_KEY,
    newsDataApiUrl: process.env.NEWSDATA_API_URL || 'https://newsdata.io/api/1/latest',
    newsApiKey: process.env.NEWSAPI_KEY,
    newsApiUrl: process.env.NEWSAPI_URL || 'https://newsapi.org/v2/top-headlines',
  },

  serpapi: {
    apiKey: process.env.SERPAPI_KEY,
    searchEngine: process.env.SERPAPI_SEARCH_ENGINE || 'google',
    newsResultsLimit: parseInt(process.env.SERPAPI_NEWS_RESULTS_LIMIT) || 10,
    trustScoreThreshold: parseInt(process.env.SERPAPI_TRUST_THRESHOLD) || 70,
  },

  rapidapi: {
    apiKey: process.env.RAPIDAPI_KEY,
    realtimeApiKey: process.env.RAPIDAPI_REALTIME_KEY,
  },

  tavily: {
    apiKey: process.env.TAVILY_API_KEY,
  },

  app: {
    maxClaimsPerMessage: parseInt(process.env.MAX_CLAIMS_PER_MESSAGE) || 3,
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.7,
    cacheTtlHours: parseInt(process.env.CACHE_TTL_HOURS) || 24,
  },
};
