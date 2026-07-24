'use strict';

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();


router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbOk = dbState === 1;

  const payload = {
    status: dbOk ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    db: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  };

  res.status(dbOk ? 200 : 503).json(payload);
});

module.exports = router;
