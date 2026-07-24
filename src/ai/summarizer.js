'use strict';

const { generate } = require('./ollamaClient');
const { summaryPrompt, whyItMattersPrompt } = require('./prompts');
const { withRetry } = require('../utils/retry');
const logger = require('../utils/logger');

/**
 * Generates the summary and "why it matters" text for an article. Two
 * separate model calls by design — see prompts.js for the reasoning.
 * @param {string} headline
 * @param {string} articleText
 * @returns {Promise<{ summary: string, whyItMatters: string }>}
 */
async function summarizeArticle(headline, articleText) {
  const { system: sysA, prompt: promptA } = summaryPrompt(headline, articleText);
  const summary = await withRetry(() => generate({ system: sysA, prompt: promptA }), {
    retries: 2,
    label: 'ollama-summary',
  });

  const { system: sysB, prompt: promptB } = whyItMattersPrompt(headline, summary);
  const whyItMatters = await withRetry(() => generate({ system: sysB, prompt: promptB }), {
    retries: 2,
    label: 'ollama-why-it-matters',
  });

  logger.debug({ headline }, 'Summary generated');
  return { summary: summary.trim(), whyItMatters: whyItMatters.trim() };
}

module.exports = { summarizeArticle };
