'use strict';

const User = require('../../models/User');

async function digestCommand(ctx) {
  const existingUser = await User.findOne({ telegramId: ctx.from.id });
  return ctx.scene.enter('onboarding', { existingUser, jumpTo: 'digest' });
}

module.exports = { digestCommand };
