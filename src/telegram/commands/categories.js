'use strict';

const User = require('../../models/User');

async function categoriesCommand(ctx) {
  const existingUser = await User.findOne({ telegramId: ctx.from.id });
  return ctx.scene.enter('onboarding', { existingUser, jumpTo: 'categories' });
}

module.exports = { categoriesCommand };
