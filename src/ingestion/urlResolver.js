'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const GOOGLE_NEWS_PATTERN = /^https?:\/\/news\.google\.com\/rss\/articles\//;

const SKIP_PATTERNS = [
  /\/videos?\//i,
  /\/video$/i,
  /\/watch\?/i,
  /youtube\.com/i,
  /vimeo\.com/i,
  /\/live\//i,
  /\.mp4$/i,
  /\.mp3$/i,
];

/**
 * Returns true if a URL is a type that will reliably fail content
 * extraction (video pages, media files, etc.) and should be skipped
 * before even attempting Readability or Playwright.
 * @param {string} url
 * @returns {boolean}
 */
function shouldSkipUrl(url) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Google News RSS feeds give obfuscated redirect URLs like:
 *   https://news.google.com/rss/articles/CBMiuAFBV...?oc=5
 *
 * These need to be resolved to the actual article URL before extraction.
 * This function makes an HTTP request and follows the redirect chain,
 * capturing the final destination URL. axios stores the last response URL
 * on `response.request.res.responseUrl` after following all redirects.
 *
 * If resolution fails (Google blocks the request, timeout, etc.), the
 * original URL is returned so the extractor can try its own luck.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
async function resolveGoogleNewsUrl(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://news.google.com/',
      },
      maxRedirects: 10,
      timeout: 12000,
    });

    const finalUrl = response.request?.res?.responseUrl || response.request?.responseURL;

    if (finalUrl && !finalUrl.includes('news.google.com')) {
      logger.debug({ original: url, resolved: finalUrl }, 'Resolved Google News URL');
      return finalUrl;
    }

    return url;
  } catch (err) {
    // Non-fatal — return original URL and let the extractor try.
    logger.debug({ err: err.message, url }, 'Google News URL resolution failed, using original');
    return url;
  }
}

/**
 * Resolves a URL if needed (Google News redirect), and checks whether it
 * should be skipped entirely (video/media). Returns `null` if the URL
 * should be skipped, otherwise the resolved URL to extract content from.
 * @param {string} url
 * @returns {Promise<string|null>}
 */
async function prepareUrl(url) {
  if (shouldSkipUrl(url)) return null;

  if (GOOGLE_NEWS_PATTERN.test(url)) {
    const resolved = await resolveGoogleNewsUrl(url);
    // If resolution gave us back a Google URL (failed to resolve), skip it
    // rather than wasting Playwright time on a redirect page.
    if (resolved.includes('news.google.com')) return null;
    // Check the resolved URL for skip patterns too.
    if (shouldSkipUrl(resolved)) return null;
    return resolved;
  }

  return url;
}

module.exports = { prepareUrl, shouldSkipUrl, resolveGoogleNewsUrl };
