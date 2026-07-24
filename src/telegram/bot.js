'use strict';

const { Telegraf, Scenes, session } = require('telegraf');
const config = require('../config');
const logger = require('../utils/logger');

const onboardingScene = require('./scenes/onboardingScene');
const { startCommand } = require('./commands/start');
const { settingsCommand } = require('./commands/settings');
const { categoriesCommand } = require('./commands/categories');
const { topicsCommand } = require('./commands/topics');
const { keywordsCommand } = require('./commands/keywords');
const { digestCommand } = require('./commands/digest');
const { helpCommand } = require('./commands/help');

const bot = new Telegraf(config.telegramBotToken);

const stage = new Scenes.Stage([onboardingScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start(startCommand);
bot.command('settings', settingsCommand);
bot.command('categories', categoriesCommand);
bot.command('topics', topicsCommand);
bot.command('keywords', keywordsCommand);
bot.command('digest', digestCommand);
bot.command('help', helpCommand);

bot.catch((err, ctx) => {
  logger.error({ err: err.message, updateType: ctx.updateType }, 'Unhandled Telegraf error');
});

function startBot() {
  bot.launch();
  logger.info('Telegram bot started (polling mode)');
}

function stopBot(signal) {
  bot.stop(signal);
}

module.exports = { bot, startBot, stopBot };
