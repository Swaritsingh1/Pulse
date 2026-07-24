'use strict';

const User = require('../../models/User');

async function topicsCommand(ctx) {
  const existingUser = await User.findOne({ telegramId: ctx.from.id });
  if (!existingUser || existingUser.selectedCategories.length === 0) {
    await ctx.reply('Pick your categories first with /categories.');
    return;
  }
  return ctx.scene.enter('onboarding', { existingUser, jumpTo: 'topics' });
}

module.exports = { topicsCommand };
