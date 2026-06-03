'use strict';
const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const { fail, codes } = require('./utils/response');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(logger);

// 简易 API Key 鉴权
app.use(function (req, res, next) {
  if (req.path === '/health') return next();
  const key = req.header('X-API-Key') || req.query.api_key;
  if (!key || key !== config.apiKey) {
    return fail(res, codes.UNAUTHORIZED, 'API Key 无效', 401);
  }
  next();
});

app.get('/health', function (req, res) {
  res.json({ status: 'ok', env: config.env, time: new Date().toISOString() });
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
