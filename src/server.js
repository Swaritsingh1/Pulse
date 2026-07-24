'use strict';

const { connectDB } = require('./db/connection');
const { startBot, stopBot, bot } = require('./telegram/bot');
const { startScheduler } = require('./jobs/scheduler');
const { closeBrowser } = require('./extraction/playwrightFallback');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

async function main() {
  await connectDB();

  startBot();

  startScheduler(bot);

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'HTTP server listening');
  });

  async function shutdown(signal) {
    logger.info({ signal }, 'Shutdown signal received');
    stopBot(signal);
    await closeBrowser();
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  }

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err.message);
  process.exit(1);
});
