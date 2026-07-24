'use strict';

const pLimit = require('p-limit');
const Article = require('../models/Article');
const { pollAllFeeds } = require('../ingestion/feedPoller');
const { prepareUrl } = require('../ingestion/urlResolver');
const { extractWithReadability } = require('../extraction/readabilityExtractor');
const { extractWithPlaywright } = require('../extraction/playwrightFallback');
const { summarizeArticle } = require('../ai/summarizer');
const { classifyTopics } = require('../ai/classifier');
const { embed } = require('../ai/ollamaClient');
const { resolveStory } = require('../storyEngine/storyDecision');
const { dispatchStoryNotification } = require('../notifications/dispatcher');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Runs one full ingestion cycle: poll feeds, then process every genuinely
 * new item through extraction -> summarization -> story resolution ->
 * notification. A concurrency cap on the Ollama-calling stage keeps a
 * single local model instance from being overwhelmed.
 * @param {import('telegraf').Telegraf} bot
 * @returns {Promise<void>}
 */
async function runIngestionPipeline(bot) {
  const items = await pollAllFeeds();
  const limit = pLimit(config.concurrency.ollamaCalls);

  const newItems = [];
  for (const item of items) {
    const exists = await Article.exists({ url: item.link });
    if (!exists) newItems.push(item);
  }

  // Sort newest-first so the cap below keeps the most recent articles.
  newItems.sort((a, b) => b.pubDate - a.pubDate);

  const cap = config.content.maxArticlesPerCycle;
  const batch = newItems.slice(0, cap);

  if (newItems.length > cap) {
    logger.info(
      { newItemCount: newItems.length, processing: cap },
      `Processing newest ${cap} of ${newItems.length} new articles (cap applied). Remainder will be processed in future cycles.`,
    );
  } else {
    logger.info({ newItemCount: batch.length }, 'Processing new articles');
  }

  await Promise.all(batch.map((item) => limit(() => processArticle(item, bot))));
}

/**
 * Processes a single RSS item end-to-end. Failures are caught and logged
 * per-article so one bad article never breaks the rest of the cycle.
 * @param {object} item
 * @param {import('telegraf').Telegraf} bot
 */
async function processArticle(item, bot) {
  try {
    // Resolve Google News redirect URLs to the real article URL, and filter
    // out video/media URLs that will never yield extractable text.
    const resolvedUrl = await prepareUrl(item.link);
    if (!resolvedUrl) {
      // Mark as seen so we don't retry it every cycle.
      await Article.create({
        originalTitle: item.title,
        source: item.sourceName,
        url: item.link,
        fullArticle: '',
        publishedDate: item.pubDate,
      }).catch(() => {});
      return;
    }

    let extracted = await extractWithReadability(resolvedUrl);
    if (!extracted) extracted = await extractWithPlaywright(resolvedUrl);
    if (!extracted) {
      logger.warn({ url: resolvedUrl }, 'Extraction failed for both strategies, skipping');
      // Mark as seen to prevent retrying unextractable URLs every cycle.
      await Article.create({
        originalTitle: item.title,
        source: item.sourceName,
        url: item.link,
        fullArticle: '',
        publishedDate: item.pubDate,
      }).catch(() => {});
      return;
    }

    const headline = extracted.title || item.title;

    const article = await Article.create({
      originalTitle: headline,
      source: item.sourceName,
      url: item.link,
      fullArticle: extracted.textContent,
      publishedDate: item.pubDate,
    });

    const { summary, whyItMatters } = await summarizeArticle(headline, extracted.textContent);
    const topics = item.topic
      ? [item.topic]
      : await classifyTopics(item.category, headline, extracted.textContent.slice(0, 500));
    const embedding = await embed(`${headline}\n${summary}`);

    const { story, isNewStory, isNotifiableUpdate, updateNumber } = await resolveStory({
      headline,
      summary,
      whyItMatters,
      category: item.category,
      topics,
      sourceName: item.sourceName,
      articleUrl: item.link,
      articleText: extracted.textContent,
      publishedDate: item.pubDate,
      embedding,
    });

    article.storyId = story._id;
    await article.save();

    if (isNewStory || isNotifiableUpdate) {
      await dispatchStoryNotification(bot, story, { isNewStory, updateNumber });
    }
  } catch (err) {
    logger.error({ err: err.message, url: item.link }, 'Article processing failed');
  }
}

module.exports = { runIngestionPipeline };
