'use strict';

/**
 * Rough word count.
 * @param {string} text
 * @returns {number}
 */
function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Estimated reading time in minutes at ~200 wpm, minimum 1.
 * @param {string} text
 * @returns {number}
 */
function estimateReadingMinutes(text) {
  return Math.max(1, Math.round(wordCount(text) / 200));
}

/**
 * Truncates text to a max character length on a word boundary.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string}
 */
function truncate(text, maxChars) {
  if (!text || text.length <= maxChars) return text || '';
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxChars)}…`;
}

/**
 * Normalizes a headline into a sorted, deduplicated, lowercase token
 * string with stopword-length filtering — used as a cheap pre-filter
 * signal before running embedding similarity.
 * @param {string} headline
 * @returns {string}
 */
function canonicalizeHeadline(headline) {
  if (!headline) return '';
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .sort()
    .join(' ');
}

module.exports = { wordCount, estimateReadingMinutes, truncate, canonicalizeHeadline };
