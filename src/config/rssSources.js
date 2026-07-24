'use strict';

const { TOPICS_BY_CATEGORY } = require('./topics');

/**
 * Hand-picked, stable official RSS feeds. Used wherever a publisher
 * maintains a reliable public feed. This list is intentionally small —
 * topic-level coverage (OpenAI, NVIDIA, ISRO, Cursor, etc.) is generated
 * separately via Google News query feeds below, since most companies and
 * narrow topics in the taxonomy don't publish their own RSS feed at all.
 * @type {Array<{name: string, url: string, category: string}>}
 */
const CURATED_FEEDS = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'AI' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Technology' },
  { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', category: 'Technology' },
  { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', category: 'Business' },
  { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'Business' },
  { name: 'BBC Politics', url: 'http://feeds.bbci.co.uk/news/politics/rss.xml', category: 'Politics' },
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'World' },
  { name: 'NASA', url: 'https://www.nasa.gov/feed/', category: 'Space' },
  { name: 'ESA', url: 'https://www.esa.int/rssfeed/Our_Activities/Space_News', category: 'Space' },
  { name: 'BBC Sport', url: 'http://feeds.bbci.co.uk/sport/rss.xml', category: 'Sports' },
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'Sports' },
  { name: 'WHO', url: 'https://www.who.int/rss-feeds/news-english.xml', category: 'Health' },
  { name: 'BBC Health', url: 'http://feeds.bbci.co.uk/news/health/rss.xml', category: 'Health' },
  { name: 'Nature', url: 'https://www.nature.com/nature.rss', category: 'Science' },
  { name: 'BBC Science & Environment', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: 'Science' },
  { name: 'Variety', url: 'https://variety.com/feed/', category: 'Entertainment' },
  { name: 'IGN', url: 'http://feeds.ign.com/ign/all', category: 'Entertainment' },
  { name: 'BBC Entertainment & Arts', url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', category: 'Entertainment' },
];

/**
 * Builds a Google News RSS search URL for a given query. This is Google's
 * own public RSS endpoint (not scraping), and is the most reliable way to
 * get per-topic coverage for narrow, fast-moving subjects that don't have
 * their own official feed. Each resulting <item> still carries the real
 * original publisher in its <source> tag, which feedPoller.js reads to
 * populate Article.source/Story.sources correctly — so "sources" still
 * reflects Reuters/BBC/etc, not "Google News".
 * @param {string} query
 * @returns {string}
 */
function googleNewsFeed(query) {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}+when:1d&hl=en-US&gl=US&ceid=US:en`;
}

/**
 * Auto-generates one topic-level feed per entry in the topic taxonomy
 * (config/topics.js is the single source of truth), so adding a topic
 * there automatically gives it RSS coverage with no extra wiring.
 * @returns {Array<{name: string, url: string, category: string, topic: string}>}
 */
function buildTopicFeeds() {
  const feeds = [];
  for (const [category, topics] of Object.entries(TOPICS_BY_CATEGORY)) {
    for (const topic of topics) {
      feeds.push({ name: topic, url: googleNewsFeed(topic), category, topic });
    }
  }
  return feeds;
}

/**
 * The full feed list polled by the ingestion service: curated official
 * feeds plus generated per-topic feeds.
 * @returns {Array<{name: string, url: string, category: string, topic?: string}>}
 */
function getAllFeeds() {
  return [...CURATED_FEEDS, ...buildTopicFeeds()];
}

module.exports = { CURATED_FEEDS, googleNewsFeed, buildTopicFeeds, getAllFeeds };
