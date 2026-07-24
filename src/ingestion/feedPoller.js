'use strict';

const Parser = require('rss-parser');
const pLimit = require('p-limit');
const { getAllFeeds } = require('../config/rssSources');
const config = require('../config');
const logger = require('../utils/logger');

const parser = new Parser({
  timeout: 10000,
  customFields: {
    // Google News RSS items carry the real publisher in a <source> tag.
    item: [['source', 'sourceTag', { keepArray: false }]],
  },
});

/**
 * Fetches and parses every configured feed, tagging each item with its
 * category/topic and the originating publisher (when available).
 * @returns {Promise<Array<{title: string, link: string, pubDate: Date, sourceName: string, category: string, topic: string|null}>>}
 */
async function pollAllFeeds() {
  const feeds = getAllFeeds();
  const limit = pLimit(config.concurrency.feedFetch);
  const items = [];

  await Promise.all(
    feeds.map((feed) =>
      limit(async () => {
        try {
          const parsed = await parser.parseURL(feed.url);
          for (const item of parsed.items) {
            if (!item.link || !item.title) continue;
            items.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              sourceName: extractSourceName(item, feed),
              category: feed.category,
              topic: feed.topic || null,
            });
          }
        } catch (err) {
          logger.warn({ err: err.message, feed: feed.name }, 'Feed fetch failed');
        }
      }),
    ),
  );

  logger.info({ feedCount: feeds.length, itemCount: items.length }, 'Feed poll complete');
  return items;
}

/**
 * Google News items carry the real publisher in a <source> tag; official
 * feeds don't, so we fall back to the feed's own configured name.
 */
function extractSourceName(item, feed) {
  if (item.sourceTag && typeof item.sourceTag === 'object' && item.sourceTag._) {
    return item.sourceTag._;
  }
  if (typeof item.sourceTag === 'string' && item.sourceTag.trim()) {
    return item.sourceTag.trim();
  }
  return feed.name;
}

module.exports = { pollAllFeeds };
