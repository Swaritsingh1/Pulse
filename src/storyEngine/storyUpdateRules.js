'use strict';

const { generate } = require('../ai/ollamaClient');
const { significantUpdatePrompt } = require('../ai/prompts');
const logger = require('../utils/logger');

/**
 * Decides whether a near-duplicate article adds enough new information to
 * justify a Live Story notification (official confirmation, changed
 * numbers, major developments), or whether it's routine re-reporting that
 * should just be attached as an extra source silently.
 * @param {string} existingSummary
 * @param {string} newArticleExcerpt
 * @returns {Promise<boolean>}
 */
async function isSignificantUpdate(existingSummary, newArticleExcerpt) {
  try {
    const { system, prompt } = significantUpdatePrompt(existingSummary, newArticleExcerpt.slice(0, 2000));
    const result = await generate({ system, prompt, temperature: 0.1 });
    const firstLine = result.trim().split('\n')[0].toUpperCase();
    return firstLine.startsWith('YES');
  } catch (err) {
    logger.warn({ err: err.message }, 'Significance check failed, defaulting to no notification');
    return false;
  }
}

module.exports = { isSignificantUpdate };
