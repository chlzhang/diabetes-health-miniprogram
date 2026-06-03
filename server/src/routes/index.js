'use strict';
const express = require('express');
const router = express.Router();
const recommendRouter = require('./recommend');
const analysisRouter = require('./analysis');
const chatRouter = require('./chat');
const userRouter = require('./user');

router.get('/', function (req, res) {
  res.json({
    name: 'diabetes-health-backend',
    version: '1.0.0',
    apiVersion: 'v1',
    endpoints: {
      recommend: {
        'POST /api/v1/recommend/diet': '生成饮食方案',
        'POST /api/v1/recommend/exercise': '生成运动方案',
        'POST /api/v1/recommend/comprehensive': '综合方案（饮食+运动+风险）',
        'GET  /api/v1/recommend/context/:userId': '查看 LLM 上下文（调试）'
      },
      analysis: {
        'GET /api/v1/analysis/diet?userId=&days=': '饮食分析',
        'GET /api/v1/analysis/exercise?userId=&days=': '运动分析',
        'GET /api/v1/analysis/bloodsugar?userId=&days=': '血糖分析',
        'GET /api/v1/analysis/overview?userId=&days=': '综合分析',
        'GET /api/v1/analysis/records/:userId?type=&days=': '原始记录'
      },
      chat: {
        'POST /api/v1/chat': 'AI 对话'
      },
      user: {
        'GET /api/v1/user/:userId': '获取用户',
        'PUT /api/v1/user/:userId': '创建/更新用户',
        'POST /api/v1/user/:userId/meals': '批量上报饮食',
        'POST /api/v1/user/:userId/exercises': '批量上报运动',
        'POST /api/v1/user/:userId/bloodsugars': '批量上报血糖'
      }
    },
    auth: '需要请求头 X-API-Key，与 .env 中 API_KEY 一致'
  });
});

router.use('/recommend', recommendRouter);
router.use('/analysis', analysisRouter);
router.use('/chat', chatRouter);
router.use('/user', userRouter);

module.exports = router;
