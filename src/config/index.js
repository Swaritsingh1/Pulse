'use strict';

require('dotenv').config();

/**
 * Reads a required environment variable, throwing a clear error if it's
 * missing so the app fails fast at startup rather than later in a job.
 * @param {string} key
 * @returns {string}
 */
function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  logLevel: process.env.LOG_LEVEL || 'info',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse',

  telegramBotToken: required('TELEGRAM_BOT_TOKEN'),

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    chatModel: process.env.OLLAMA_CHAT_MODEL || 'qwen3:1.7b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  },

  cron: {
    rssPoll: process.env.RSS_POLL_CRON || '*/10 * * * *',
    digestMorning: process.env.DIGEST_MORNING_CRON || '0 8 * * *',
    digestEvening: process.env.DIGEST_EVENING_CRON || '0 19 * * *',
  },

  dedup: {
    similarityThreshold: Number(process.env.DEDUP_SIMILARITY_THRESHOLD) || 0.84,
    nearDuplicateThreshold: Number(process.env.DEDUP_NEAR_DUPLICATE_THRESHOLD) || 0.95,
    windowHours: Number(process.env.DEDUP_WINDOW_HOURS) || 72,
  },

  content: {
    maxArticleChars: Number(process.env.MAX_ARTICLE_CHARS) || 6000,
    maxArticlesPerCycle: Number(process.env.MAX_ARTICLES_PER_CYCLE) || 200,
  },

  concurrency: {
    feedFetch: Number(process.env.FEED_FETCH_CONCURRENCY) || 5,
    ollamaCalls: Number(process.env.OLLAMA_CONCURRENCY) || 2,
  },
};

module.exports = config;
