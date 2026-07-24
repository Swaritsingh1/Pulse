'use strict';

const { Scenes } = require('telegraf');
const User = require('../../models/User');
const {
  categoryKeyboard,
  topicKeyboard,
  notificationModeKeyboard,
  digestKeyboard,
  keywordSkipKeyboard,
} = require('../keyboards');
const logger = require('../../utils/logger');

const STEP = {
  CATEGORIES: 'categories',
  TOPICS: 'topics',
  KEYWORDS: 'keywords',
  MODE: 'mode',
  DIGEST: 'digest',
};

const onboardingScene = new Scenes.WizardScene(
  'onboarding',
  async (ctx) => {
    const existing = ctx.scene.state?.existingUser;
    const jumpTo = ctx.scene.state?.jumpTo;

    const data = {
      selectedCategories: existing?.selectedCategories ? [...existing.selectedCategories] : [],
      selectedTopics: existing?.selectedTopics ? existing.selectedTopics.map((t) => ({ category: t.category, topics: [...t.topics] })) : [],
      categoryCursor: 0,
      customKeywords: existing?.customKeywords ? [...existing.customKeywords] : [],
      notificationMode: existing?.notificationMode || null,
      digestPreference: existing?.digestPreference || null,
      step: STEP.CATEGORIES,
    };
    ctx.wizard.state.data = data;

    if (jumpTo === 'keywords') {
      data.step = STEP.KEYWORDS;
      await ctx.reply(
        'Custom keyword alerts (up to 5, comma-separated, e.g. Tesla, Delhi Metro, Cybersecurity).\n' +
          'Send your list, or tap Skip to keep your current keywords.',
        keywordSkipKeyboard(),
      );
      return ctx.wizard.next();
    }

    if (jumpTo === 'digest') {
      data.step = STEP.DIGEST;
      await ctx.reply(
        'Daily Digest\n\nA Daily Digest combines the most important stories you may have missed into one concise summary.',
        digestKeyboard(),
      );
      return ctx.wizard.next();
    }

    if (jumpTo === 'topics' && data.selectedCategories.length > 0) {
      data.step = STEP.TOPICS;
      data.categoryCursor = 0;
      const firstCategory = data.selectedCategories[0];
      const existingTopics = data.selectedTopics.find((t) => t.category === firstCategory)?.topics || [];
      await ctx.reply(`Topics for ${firstCategory}:`, topicKeyboard(firstCategory, existingTopics));
      return ctx.wizard.next();
    }

    if (!existing) {
      await ctx.reply(
        'Welcome to Pulse.\n\n' +
          'Pulse monitors trusted news sources and delivers personalized AI-powered summaries directly to Telegram.\n\n' +
          "Let's personalize your experience.",
      );
    }
    await ctx.reply('Step 1 — Choose your categories (tap to select, multiple allowed):', categoryKeyboard(data.selectedCategories));
    return ctx.wizard.next();
  },

  async (ctx) => {
    const { data } = ctx.wizard.state;
    if (data.step === STEP.KEYWORDS && ctx.message?.text) {
      const keywords = ctx.message.text
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 5);
      data.customKeywords = keywords;
      data.step = STEP.MODE;
      await ctx.reply(
        'Notification Mode\n\n' +
          'Important News — meaningful updates related to your interests, routine coverage filtered out.\n' +
          'Breaking News Only — only major developing events.',
        notificationModeKeyboard(),
      );
    }
  },
);

onboardingScene.action(/^cat:(.+)$/, async (ctx) => {
  const { data } = ctx.wizard.state;
  const value = ctx.match[1];

  if (value === 'done') {
    if (data.selectedCategories.length === 0) {
      return ctx.answerCbQuery('Pick at least one category first.', { show_alert: true });
    }
    await ctx.answerCbQuery();
    data.step = STEP.TOPICS;
    data.categoryCursor = 0;
    const firstCategory = data.selectedCategories[0];
    return ctx.editMessageText(`Step 2 — Topics for ${firstCategory}:`, topicKeyboard(firstCategory, []));
  }

  await ctx.answerCbQuery();
  const idx = data.selectedCategories.indexOf(value);
  if (idx >= 0) data.selectedCategories.splice(idx, 1);
  else data.selectedCategories.push(value);

  return ctx.editMessageReplyMarkup(categoryKeyboard(data.selectedCategories).reply_markup);
});

onboardingScene.action(/^topic:(.+)$/, async (ctx) => {
  const { data } = ctx.wizard.state;
  const value = ctx.match[1];
  const currentCategory = data.selectedCategories[data.categoryCursor];

  let entry = data.selectedTopics.find((t) => t.category === currentCategory);
  if (!entry) {
    entry = { category: currentCategory, topics: [] };
    data.selectedTopics.push(entry);
  }

  if (value === 'done') {
    await ctx.answerCbQuery();
    data.categoryCursor += 1;
    if (data.categoryCursor < data.selectedCategories.length) {
      const nextCategory = data.selectedCategories[data.categoryCursor];
      const existingTopics = data.selectedTopics.find((t) => t.category === nextCategory)?.topics || [];
      return ctx.editMessageText(`Topics for ${nextCategory}:`, topicKeyboard(nextCategory, existingTopics));
    }

    data.step = STEP.KEYWORDS;
    return ctx.editMessageText(
      'Step 3 — Would you like custom keyword alerts?\n\n' +
        'Send up to 5 comma-separated keywords (e.g. Tesla, Delhi Metro, Cybersecurity), or tap Skip.',
      keywordSkipKeyboard(),
    );
  }

  await ctx.answerCbQuery();
  const idx = entry.topics.indexOf(value);
  if (idx >= 0) entry.topics.splice(idx, 1);
  else entry.topics.push(value);

  return ctx.editMessageReplyMarkup(topicKeyboard(currentCategory, entry.topics).reply_markup);
});

onboardingScene.action('keywords:skip', async (ctx) => {
  const { data } = ctx.wizard.state;
  await ctx.answerCbQuery();
  data.step = STEP.MODE;
  return ctx.editMessageText(
    'Notification Mode\n\n' +
      'Important News — meaningful updates related to your interests, routine coverage filtered out.\n' +
      'Breaking News Only — only major developing events.',
    notificationModeKeyboard(),
  );
});

onboardingScene.action(/^mode:(.+)$/, async (ctx) => {
  const { data } = ctx.wizard.state;
  await ctx.answerCbQuery();
  data.notificationMode = ctx.match[1];
  data.step = STEP.DIGEST;
  return ctx.editMessageText(
    'Daily Digest\n\nA Daily Digest combines the most important stories you may have missed into one concise summary.',
    digestKeyboard(),
  );
});

onboardingScene.action(/^digest:(.+)$/, async (ctx) => {
  const { data } = ctx.wizard.state;
  await ctx.answerCbQuery();
  data.digestPreference = ctx.match[1];

  await User.findOneAndUpdate(
    { telegramId: ctx.from.id },
    {
      telegramId: ctx.from.id,
      username: ctx.from.username || null,
      firstName: ctx.from.first_name || null,
      selectedCategories: data.selectedCategories,
      selectedTopics: data.selectedTopics,
      customKeywords: data.customKeywords,
      notificationMode: data.notificationMode,
      digestPreference: data.digestPreference,
      onboardingCompleted: true,
    },
    { upsert: true, new: true },
  );

  logger.info({ telegramId: ctx.from.id }, 'Onboarding/settings update saved');

  await ctx.editMessageText(
    "You're all set! Pulse will start sending you personalized news.\n\n" +
      'You can change any of these preferences anytime with /settings.',
  );
  return ctx.scene.leave();
});

module.exports = onboardingScene;
