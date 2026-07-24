'use strict';

const { Markup } = require('telegraf');
const { CATEGORIES, TOPICS_BY_CATEGORY } = require('../config/topics');

/**
 * Builds a multi-select category keyboard with checkmarks for selections.
 * @param {string[]} selected
 */
function categoryKeyboard(selected) {
  const buttons = CATEGORIES.map((cat) => {
    const mark = selected.includes(cat) ? '✅ ' : '';
    return Markup.button.callback(`${mark}${cat}`, `cat:${cat}`);
  });
  const rows = chunk(buttons, 2);
  rows.push([Markup.button.callback('Done ➡️', 'cat:done')]);
  return Markup.inlineKeyboard(rows);
}

/**
 * Builds a multi-select topic keyboard for a single category.
 * @param {string} category
 * @param {string[]} selected
 */
function topicKeyboard(category, selected) {
  const topics = TOPICS_BY_CATEGORY[category] || [];
  const buttons = topics.map((topic) => {
    const mark = selected.includes(topic) ? '✅ ' : '';
    return Markup.button.callback(`${mark}${topic}`, `topic:${topic}`);
  });
  const rows = chunk(buttons, 2);
  rows.push([Markup.button.callback('Next ➡️', 'topic:done')]);
  return Markup.inlineKeyboard(rows);
}

/** Notification mode selection keyboard. */
function notificationModeKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Important News', 'mode:IMPORTANT')],
    [Markup.button.callback('Breaking News Only', 'mode:BREAKING_ONLY')],
  ]);
}

/** Daily digest preference keyboard. */
function digestKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Morning', 'digest:MORNING')],
    [Markup.button.callback('Evening', 'digest:EVENING')],
    [Markup.button.callback('Morning + Evening', 'digest:BOTH')],
    [Markup.button.callback('None', 'digest:NONE')],
  ]);
}

/** Skip/continue keyboard used on the optional keyword step. */
function keywordSkipKeyboard() {
  return Markup.inlineKeyboard([[Markup.button.callback('Skip', 'keywords:skip')]]);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

module.exports = { categoryKeyboard, topicKeyboard, notificationModeKeyboard, digestKeyboard, keywordSkipKeyboard };
