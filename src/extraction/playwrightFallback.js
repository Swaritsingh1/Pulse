'use strict';

const { chromium } = require('playwright');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { cleanContent } = require('./contentCleaner');
const config = require('../config');
const logger = require('../utils/logger');

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

/**
 * Fallback extractor for JS-rendered pages where static fetching fails.
 * Used sparingly — only when extractWithReadability() returns null —
 * since launching a real browser is comparatively expensive.
 * @param {string} url
 * @returns {Promise<{ title: string, textContent: string } | null>}
 */
async function extractWithPlaywright(url) {
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const html = await page.content();

    const dom = new JSDOM(html, { url });
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
    logger.warn({ err: err.message, url }, 'Playwright extraction failed');
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

/** Closes the shared browser instance — call on graceful shutdown. */
async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close().catch(() => {});
    browserPromise = null;
  }
}

module.exports = { extractWithPlaywright, closeBrowser };
