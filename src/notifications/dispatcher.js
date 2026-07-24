'use strict';

const Notification = require('../models/Notification');
const { findInterestedUsers } = require('./matcher');
const { formatStoryMessage } = require('../telegram/formatters');
const { withRetry } = require('../utils/retry');
const logger = require('../utils/logger');

/**
 * Sends a story notification to every interested user who hasn't already
 * received it, and records each send to prevent duplicates (also backed
 * by a unique index on Notification, so this is belt-and-suspenders).
 * @param {import('telegraf').Telegraf} bot
 * @param {object} story
 * @param {{ isNewStory: boolean, updateNumber: number }} meta
 * @returns {Promise<number>} number of users notified
 */
async function dispatchStoryNotification(bot, story, meta) {
  const users = await findInterestedUsers(story);
  const notificationType = meta.isNewStory ? 'NEW_STORY' : 'LIVE_STORY';
  const message = formatStoryMessage(story, notificationType, meta.updateNumber);

  let sentCount = 0;
  for (const user of users) {
    const alreadySent = await Notification.findOne({
      userId: user._id,
      storyId: story._id,
      updateNumber: meta.updateNumber,
    });
    if (alreadySent) continue;

    try {
      await withRetry(() => bot.telegram.sendMessage(user.telegramId, message, { parse_mode: 'HTML' }), {
        retries: 2,
        label: `telegram-send-${user.telegramId}`,
      });
      await Notification.create({
        userId: user._id,
        storyId: story._id,
        notificationType,
        updateNumber: meta.updateNumber,
      });
      sentCount += 1;
    } catch (err) {
      logger.error({ err: err.message, userId: user.telegramId }, 'Failed to deliver notification');
    }
  }

  logger.info({ storyId: story._id, sentCount, notificationType }, 'Notification dispatch complete');
  return sentCount;
}

module.exports = { dispatchStoryNotification };
