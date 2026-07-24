'use strict';

const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB. Exits the process on initial failure since the app
 * cannot do anything useful without a database connection.
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri);
    logger.info({ uri: config.mongodbUri }, 'MongoDB connected');
  } catch (err) {
    logger.error({ err: err.message }, 'MongoDB connection failed');
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error({ err: err.message }, 'MongoDB connection error');
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

module.exports = { connectDB };
