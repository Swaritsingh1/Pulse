'use strict';

/** @typedef {'AI'|'Technology'|'Business'|'Finance'|'Politics'|'World'|'Space'|'Sports'|'Health'|'Entertainment'|'Science'} Category */

const CATEGORIES = [
  'AI',
  'Technology',
  'Business',
  'Finance',
  'Politics',
  'World',
  'Space',
  'Sports',
  'Health',
  'Entertainment',
  'Science',
];

/** @type {Record<string, string[]>} */
const TOPICS_BY_CATEGORY = {
  AI: ['OpenAI', 'Anthropic', 'Google AI', 'Microsoft AI', 'NVIDIA', 'Meta AI', 'Cursor', 'Perplexity', 'Midjourney', 'Mistral AI'],
  Technology: ['Apple', 'Google', 'Microsoft', 'Samsung', 'Intel', 'AMD', 'Cybersecurity', 'Consumer Tech', 'Quantum Computing', 'Startups'],
  Business: ['Company Acquisitions', 'IPOs', 'Venture Capital', 'CEOs', 'Manufacturing', 'Supply Chain', 'Corporate Earnings', 'Startups'],
  Finance: ['Stock Markets', 'Cryptocurrency', 'Banking', 'Inflation', 'RBI', 'Federal Reserve', 'Global Economy', 'Commodities'],
  Politics: ['India', 'United States', 'China', 'European Union', 'Elections', 'Diplomacy', 'International Relations', 'Government Policies'],
  World: ['Natural Disasters', 'Climate', 'Conflicts', 'Humanitarian Crises', 'Public Health', 'Environment', 'International Organizations', 'Global Events'],
  Space: ['NASA', 'ISRO', 'SpaceX', 'Blue Origin', 'ESA', 'Rocket Launches', 'Satellites', 'Astronomy', 'Planetary Missions', 'Space Exploration'],
  Sports: ['Cricket', 'Football', 'Tennis', 'Basketball', 'Formula 1', 'Chess', 'Badminton', 'Hockey', 'Athletics', 'MMA'],
  Health: ['Medical Research', 'Vaccines', 'Biotechnology', 'Mental Health', 'Pharmaceuticals', 'Disease Outbreaks', 'Nutrition', 'Public Health'],
  Entertainment: ['Movies', 'TV Shows', 'Music', 'Gaming', 'Streaming', 'Celebrities', 'Awards', 'Anime'],
  Science: ['Physics', 'Biology', 'Chemistry', 'Genetics', 'Robotics', 'Climate Science', 'Archaeology', 'AI Research'],
};

/** @type {Record<string, string>} */
const CATEGORY_EMOJI = {
  AI: '🤖',
  Technology: '💻',
  Business: '💼',
  Finance: '💰',
  Politics: '🏛️',
  World: '🌍',
  Space: '🚀',
  Sports: '🏆',
  Health: '🏥',
  Entertainment: '🎬',
  Science: '🔬',
};

module.exports = { CATEGORIES, TOPICS_BY_CATEGORY, CATEGORY_EMOJI };
