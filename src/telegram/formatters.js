'use strict';

const { CATEGORY_EMOJI } = require('../config/topics');
const { estimateReadingMinutes } = require('../utils/textHelpers');

/**
 * Escapes Telegram HTML parse-mode special characters.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Formats a single story as a Telegram message, per the spec's
 * Notification Format: category emoji, headline, summary, why it
 * matters, sources, and the live story number when applicable.
 * @param {object} story
 * @param {'NEW_STORY'|'LIVE_STORY'} notificationType
 * @param {number} updateNumber
 * @returns {string}
 */
function formatStoryMessage(story, notificationType, updateNumber) {
  const emoji = CATEGORY_EMOJI[story.category] || '📰';
  const label = notificationType === 'NEW_STORY' ? 'NEW STORY' : `LIVE STORY #${updateNumber + 1}`;
  const sources = [...new Set(story.sources)].join(', ');

  return [
    `${emoji} <b>${label}</b>`,
    '',
    `<b>${escapeHtml(story.headline)}</b>`,
    '',
    escapeHtml(story.summary),
    '',
    `<i>Why it matters</i>\n${escapeHtml(story.whyItMatters)}`,
    '',
    `<i>Sources: ${escapeHtml(sources)}</i>`,
  ].join('\n');
}

/**
 * Formats the daily digest message, grouped by category, with an
 * estimated total reading time.
 * @param {object[]} stories
 * @param {'MORNING'|'EVENING'} slot
 * @returns {string}
 */
function formatDigestMessage(stories, slot) {
  const byCategory = {};
  for (const story of stories) {
    if (!byCategory[story.category]) byCategory[story.category] = [];
    byCategory[story.category].push(story);
  }

  const totalText = stories.map((s) => s.summary).join(' ');
  const readingMinutes = estimateReadingMinutes(totalText);

  const lines = [`📋 <b>${slot === 'MORNING' ? 'Morning' : 'Evening'} Digest</b> — ~${readingMinutes} min read`, ''];

  for (const [category, items] of Object.entries(byCategory)) {
    const emoji = CATEGORY_EMOJI[category] || '📰';
    lines.push(`${emoji} <b>${category}</b>`);
    for (const story of items) {
      lines.push(`• ${escapeHtml(story.headline)}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

module.exports = { formatStoryMessage, formatDigestMessage, escapeHtml };
