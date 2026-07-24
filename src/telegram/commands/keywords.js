'use strict';

const User = require('../../models/User');

async function keywordsCommand(ctx) {
  const existingUser = await User.findOne({ telegramId: ctx.from.id });
  return ctx.scene.enter('onboarding', { existingUser, jumpTo: 'keywords' });
}

module.exports = { keywordsCommand };
