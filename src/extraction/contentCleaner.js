'use strict';

const BOILERPLATE_PATTERNS = [
  /subscribe to our newsletter/gi,
  /sign up for .*? newsletter/gi,
  /click here to subscribe/gi,
  /this article first appeared on/gi,
  /follow us on (twitter|facebook|instagram)/gi,
  /all rights reserved\.?/gi,
  /share this article/gi,
];

/**
 * Strips common boilerplate phrases and normalizes whitespace in
 * extracted article text.
 * @param {string} text
 * @returns {string}
 */
function cleanContent(text) {
  if (!text) return '';
  let cleaned = text;
  for (const pattern of BOILERPLATE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { cleanContent };
