'use strict';

const logger = require('../utils/logger');

/**
 * Minimal request logger. Logs method, path, status, and duration for
 * every HTTP request. Skips the health-check path to keep logs clean.
 * @type {import('express').RequestHandler}
 */
function requestLogger(req, res, next) {
  if (req.path === '/health') return next();
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      { method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - start },
      'HTTP request',
    );
  });
  return next();
}

module.exports = { requestLogger };
