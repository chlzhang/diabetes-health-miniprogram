'use strict';
require('dotenv').config();
const path = require('path');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiKey: process.env.API_KEY || 'dev-secret',
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || './data'),
  llm: {
    provider: process.env.LLM_PROVIDER || 'mock',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
    timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS, 10) || 30000,
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.4
  }
};

module.exports = config;
