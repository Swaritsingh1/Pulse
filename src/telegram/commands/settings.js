'use strict';

const User = require('../../models/User');

async function settingsCommand(ctx) {
  const user = await User.findOne({ telegramId: ctx.from.id });
  if (!user || !user.onboardingCompleted) {
    await ctx.reply("You haven't set up Pulse yet — let's do that now.");
    return ctx.scene.enter('onboarding');
  }

  const categoriesText = user.selectedCategories.join(', ') || 'None';
  const keywordsText = user.customKeywords.join(', ') || 'None';

  await ctx.reply(
    [
      '<b>Your Pulse settings</b>',
      `Categories: ${categoriesText}`,
      `Keywords: ${keywordsText}`,
      `Notification mode: ${user.notificationMode}`,
      `Digest: ${user.digestPreference}`,
      '',
      'Use /categories, /topics, /keywords, or /digest to change a specific setting.',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}

module.exports = { settingsCommand };
