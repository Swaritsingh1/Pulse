'use strict';

const cron = require('node-cron');
const { runIngestionPipeline } = require('./pipelineRunner');
const { sendDigest } = require('../notifications/digestBuilder');
const config = require('../config');
const logger = require('../utils/logger');

let isIngestionRunning = false;

/**
 * Registers all cron jobs. The bot instance is passed in so the pipeline
 * and digest runners can send Telegram messages without needing to import
 * the bot module directly (avoids circular dependency).
 * @param {import('telegraf').Telegraf} bot
 */
function startScheduler(bot) {
  cron.schedule(config.cron.rssPoll, async () => {
    if (isIngestionRunning) {
      logger.warn('Ingestion already running, skipping this tick');
      return;
    }
    isIngestionRunning = true;
    const start = Date.now();
    logger.info('Ingestion cycle started');
    try {
      await runIngestionPipeline(bot);
      logger.info({ durationMs: Date.now() - start }, 'Ingestion cycle complete');
    } catch (err) {
      logger.error({ err: err.message }, 'Ingestion cycle failed');
    } finally {
      isIngestionRunning = false;
    }
  });

  // Morning digest.
  cron.schedule(config.cron.digestMorning, async () => {
    logger.info('Sending morning digest');
    try {
      await sendDigest(bot, 'MORNING');
    } catch (err) {
      logger.error({ err: err.message }, 'Morning digest failed');
    }
  });

  // Evening digest.
  cron.schedule(config.cron.digestEvening, async () => {
    logger.info('Sending evening digest');
    try {
      await sendDigest(bot, 'EVENING');
    } catch (err) {
      logger.error({ err: err.message }, 'Evening digest failed');
    }
  });

  logger.info(
    {
      rssPoll: config.cron.rssPoll,
      digestMorning: config.cron.digestMorning,
      digestEvening: config.cron.digestEvening,
    },
    'Scheduler started',
  );
}

module.exports = { startScheduler };
