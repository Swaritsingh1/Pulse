'use strict';

const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { cleanContent } = require('./contentCleaner');
const config = require('../config');
const logger = require('../utils/logger');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * Downloads a URL and extracts readable article text via Readability.
 * Returns null if extraction yields too little content — the caller
 * should fall back to Playwright in that case.
 * @param {string} url
 * @returns {Promise<{ title: string, textContent: string } | null>}
 */
async function extractWithReadability(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 12000,
      maxRedirects: 5,
    });

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent || article.textContent.trim().length < 200) {
      return null;
    }

    const cleaned = cleanContent(article.textContent);
    return {
      title: article.title || '',
      textContent: cleaned.slice(0, config.content.maxArticleChars),
    };
  } catch (err) {
    logger.warn({ err: err.message, url }, 'Readability extraction failed');
    return null;
  }
}

module.exports = { extractWithReadability };
