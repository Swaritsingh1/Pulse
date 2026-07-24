'use strict';

const Story = require('../models/Story');
const User = require('../models/User');
const { formatDigestMessage } = require('../telegram/formatters');
const { withRetry } = require('../utils/retry');
const logger = require('../utils/logger');

/**
 * Sends the daily digest to every user subscribed to the given slot.
 * @param {import('telegraf').Telegraf} bot
 * @param {'MORNING'|'EVENING'} slot
 * @returns {Promise<number>}
 */
async function sendDigest(bot, slot) {
  const eligiblePrefs = slot === 'MORNING' ? ['MORNING', 'BOTH'] : ['EVENING', 'BOTH'];
  const users = await User.find({ onboardingCompleted: true, digestPreference: { $in: eligiblePrefs } });

  let sentCount = 0;
  for (const user of users) {
    const since = user.lastDigestSentAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const categories = user.selectedCategories.length > 0 ? user.selectedCategories : undefined;

    const query = { lastUpdated: { $gte: since } };
    if (categories) query.category = { $in: categories };

    const stories = await Story.find(query).sort({ lastUpdated: -1 }).limit(15);
    if (stories.length === 0) continue;

    const message = formatDigestMessage(stories, slot);

    try {
      await withRetry(() => bot.telegram.sendMessage(user.telegramId, message, { parse_mode: 'HTML' }), {
        retries: 2,
        label: `digest-send-${user.telegramId}`,
      });
      user.lastDigestSentAt = new Date();
      await user.save();
      sentCount += 1;
    } catch (err) {
      logger.error({ err: err.message, userId: user.telegramId }, 'Failed to deliver digest');
    }
  }

  logger.info({ slot, sentCount }, 'Digest dispatch complete');
  return sentCount;
}

module.exports = { sendDigest };
