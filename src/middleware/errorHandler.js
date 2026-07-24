'use strict';

const logger = require('../utils/logger');

/**
 * Express error handler. Must be registered last (four arguments) so
 * Express recognises it as an error handler rather than normal middleware.
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  logger.error({ err: err.message, status, path: req.path }, 'Unhandled request error');
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
