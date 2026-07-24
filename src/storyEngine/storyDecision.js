'use strict';

const Story = require('../models/Story');
const config = require('../config');
const { canonicalizeHeadline } = require('../utils/textHelpers');
const { findBestMatch } = require('../dedup/similarityEngine');
const { isSignificantUpdate } = require('./storyUpdateRules');
const logger = require('../utils/logger');

/**
 * Decides what to do with a newly summarized article: start a brand new
 * Story, silently attach it as an extra source on an existing Story (same
 * event, no new information), or append a notification-worthy Live Story
 * update.
 *
 * @param {object} params
 * @param {string} params.headline
 * @param {string} params.summary
 * @param {string} params.whyItMatters
 * @param {string} params.category
 * @param {string[]} params.topics
 * @param {string} params.sourceName
 * @param {string} params.articleUrl
 * @param {string} params.articleText
 * @param {Date} params.publishedDate
 * @param {number[]} params.embedding
 * @returns {Promise<{ story: object, isNewStory: boolean, isNotifiableUpdate: boolean, updateNumber: number }>}
 */
async function resolveStory(params) {
  const {
    headline,
    summary,
    whyItMatters,
    category,
    topics,
    sourceName,
    articleUrl,
    articleText,
    publishedDate,
    embedding,
  } = params;

  const windowStart = new Date(Date.now() - config.dedup.windowHours * 60 * 60 * 1000);
  const candidates = await Story.find({ category, publishedTime: { $gte: windowStart } })
    .select('+embedding')
    .lean();

  const match = candidates.length > 0 ? findBestMatch(embedding, candidates) : null;

  // No sufficiently similar recent story in this category — brand new event.
  if (!match || match.score < config.dedup.similarityThreshold) {
    const story = await Story.create({
      headline,
      canonicalHeadline: canonicalizeHeadline(headline),
      summary,
      whyItMatters,
      category,
      topics,
      sources: [sourceName],
      articleUrls: [articleUrl],
      embedding,
      publishedTime: publishedDate,
      lastUpdated: new Date(),
      storyStatus: 'NEW_STORY',
      updateCount: 0,
    });
    logger.info({ headline, category }, 'New story created');
    return { story, isNewStory: true, isNotifiableUpdate: false, updateNumber: 0 };
  }

  const existingStory = await Story.findById(match.story._id);

  if (match.score >= config.dedup.nearDuplicateThreshold) {
    addSourceAndUrl(existingStory, sourceName, articleUrl);
    await existingStory.save();
    logger.info({ headline, storyId: existingStory._id }, 'Attached as duplicate source, no notification');
    return { story: existingStory, isNewStory: false, isNotifiableUpdate: false, updateNumber: 0 };
  }

  const significant = await isSignificantUpdate(existingStory.summary, articleText);

  if (!significant) {
    addSourceAndUrl(existingStory, sourceName, articleUrl);
    await existingStory.save();
    return { story: existingStory, isNewStory: false, isNotifiableUpdate: false, updateNumber: 0 };
  }

  const updateNumber = existingStory.updateCount + 1;
  existingStory.updateCount = updateNumber;
  existingStory.storyStatus = 'LIVE_STORY';
  existingStory.summary = summary;
  existingStory.whyItMatters = whyItMatters;
  existingStory.lastUpdated = new Date();
  existingStory.liveUpdates.push({ updateNumber, text: summary, createdAt: new Date() });
  addSourceAndUrl(existingStory, sourceName, articleUrl);
  await existingStory.save();

  logger.info({ headline, storyId: existingStory._id, updateNumber }, 'Live story update');
  return { story: existingStory, isNewStory: false, isNotifiableUpdate: true, updateNumber };
}

function addSourceAndUrl(story, sourceName, articleUrl) {
  if (!story.sources.includes(sourceName)) story.sources.push(sourceName);
  if (!story.articleUrls.includes(articleUrl)) story.articleUrls.push(articleUrl);
}

module.exports = { resolveStory };
