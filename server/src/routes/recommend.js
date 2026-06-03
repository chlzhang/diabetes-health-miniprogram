'use strict';
/**
 * 方案生成路由
 * - POST /api/v1/recommend/diet            生成今日饮食方案
 * - POST /api/v1/recommend/exercise        生成本周运动方案
 * - POST /api/v1/recommend/comprehensive   综合方案（饮食+运动+风险）
 * - GET  /api/v1/recommend/context/:userId 查看 LLM 收到的上下文（调试用）
 */
const express = require('express');
const router = express.Router();
const recommend = require('../services/recommend');
const { ok, fail, codes } = require('../utils/response');

function validateUserId(req) {
  const userId = (req.body && req.body.userId) || req.query.userId;
  if (!userId) return null;
  return String(userId);
}

router.post('/diet', async function (req, res) {
  const userId = validateUserId(req);
  if (!userId) return fail(res, codes.PARAM_INVALID, '缺少 userId');
  const days = Math.max(1, Math.min(90, parseInt((req.body && req.body.days) || 7, 10)));
  const result = await recommend.generateDiet(userId, { days: days });
  if (result.error) return fail(res, codes.NOT_FOUND, '用户不存在: ' + userId);
  return ok(res, result, result.ok ? '由 LLM 生成' : '已使用本地兜底方案');
});

router.post('/exercise', async function (req, res) {
  const userId = validateUserId(req);
  if (!userId) return fail(res, codes.PARAM_INVALID, '缺少 userId');
  const days = Math.max(1, Math.min(90, parseInt((req.body && req.body.days) || 7, 10)));
  const result = await recommend.generateExercise(userId, { days: days });
  if (result.error) return fail(res, codes.NOT_FOUND, '用户不存在: ' + userId);
  return ok(res, result, result.ok ? '由 LLM 生成' : '已使用本地兜底方案');
});

router.post('/comprehensive', async function (req, res) {
  const userId = validateUserId(req);
  if (!userId) return fail(res, codes.PARAM_INVALID, '缺少 userId');
  const days = Math.max(1, Math.min(90, parseInt((req.body && req.body.days) || 7, 10)));
  const result = await recommend.generateComprehensive(userId, { days: days });
  if (result.error) return fail(res, codes.NOT_FOUND, '用户不存在: ' + userId);
  return ok(res, result, result.ok ? '由 LLM 生成' : '已使用本地兜底方案');
});

router.get('/context/:userId', function (req, res) {
  const userId = req.params.userId;
  const days = Math.max(1, Math.min(90, parseInt(req.query.days || 7, 10)));
  const ctx = recommend.buildContext(userId, days);
  if (ctx.error) return fail(res, codes.NOT_FOUND, '用户不存在: ' + userId);
  return ok(res, ctx, 'context ok');
});

module.exports = router;
