'use strict';

const logger = require('./logger');

/**
 * Retries an async function with exponential backoff.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number, baseDelayMs?: number, label?: string }} [options]
 * @returns {Promise<T>}
 */
async function withRetry(fn, options = {}) {
  const { retries = 3, baseDelayMs = 1000, label = 'operation' } = options;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      logger.warn({ err: err.message, attempt, retries, label }, `${label} failed, retrying`);
      if (attempt < retries) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error({ err: lastError?.message, label }, `${label} failed after ${retries} attempts`);
  throw lastError;
}

module.exports = { withRetry };
