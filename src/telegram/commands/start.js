'use strict';

const User = require('../../models/User');

async function startCommand(ctx) {
  const existing = await User.findOne({ telegramId: ctx.from.id });
  if (existing?.onboardingCompleted) {
    await ctx.reply("Welcome back! You're already set up. Use /settings to review or change your preferences.");
    return;
  }
  return ctx.scene.enter('onboarding');
}

module.exports = { startCommand };
