'use strict';

const { TOPICS_BY_CATEGORY } = require('../config/topics');
const { generate } = require('./ollamaClient');
const { classifyTopicPrompt } = require('./prompts');
const logger = require('../utils/logger');

/**
 * Finds matching topics for a headline within a category using simple
 * keyword matching. Category is already known from the RSS feed itself,
 * so this only needs to narrow down the topic tag(s) within it.
 * @param {string} category
 * @param {string} headline
 * @returns {string[]}
 */
function matchTopicsByKeyword(category, headline) {
  const topics = TOPICS_BY_CATEGORY[category] || [];
  const lowerHeadline = headline.toLowerCase();
  return topics.filter((topic) => lowerHeadline.includes(topic.toLowerCase()));
}

/**
 * Returns the topic tag(s) for an article: keyword match first, LLM
 * fallback only when keyword matching finds nothing. This keeps LLM load
 * low and avoids relying on a small model for open-ended classification.
 * @param {string} category
 * @param {string} headline
 * @param {string} excerpt
 * @returns {Promise<string[]>}
 */
async function classifyTopics(category, headline, excerpt) {
  const keywordMatches = matchTopicsByKeyword(category, headline);
  if (keywordMatches.length > 0) return keywordMatches;

  const allowedTopics = TOPICS_BY_CATEGORY[category] || [];
  if (allowedTopics.length === 0) return [];

  try {
    const { system, prompt } = classifyTopicPrompt(headline, excerpt, allowedTopics);
    const result = await generate({ system, prompt, temperature: 0.1 });
    const cleaned = result.trim();
    return allowedTopics.includes(cleaned) ? [cleaned] : [];
  } catch (err) {
    logger.warn({ err: err.message, headline }, 'Topic classification fallback failed');
    return [];
  }
}

module.exports = { matchTopicsByKeyword, classifyTopics };
