'use strict';
/**
 * AI 对话路由
 * - POST /api/v1/chat
 *   请求: { userId, message, history?: [{role, content}] }
 *   响应: { reply, suggestions, followup, analysis }
 */
const express = require('express');
const router = express.Router();
const store = require('../services/data/store');
const recommend = require('../services/recommend');
const { ok, fail, codes } = require('../utils/response');

router.post('/', async function (req, res) {
  const body = req.body || {};
  const userId = body.userId;
  const message = (body.message || '').trim();
  if (!userId) return fail(res, codes.PARAM_INVALID, '缺少 userId');
  if (!message) return fail(res, codes.PARAM_INVALID, '缺少 message');
  if (!store.getUser(userId)) return fail(res, codes.NOT_FOUND, '用户不存在: ' + userId);
  if (message.length > 1000) return fail(res, codes.PARAM_INVALID, '消息过长（>1000 字符）');
  const history = Array.isArray(body.history) ? body.history : [];
  const result = await recommend.chat(userId, history, message);
  let message2 = 'ok';
  if (result.source === 'rule') message2 = '已使用本地方案（AI 暂时不可用）';
  else if (!result.ok) message2 = '生成失败';
  return ok(res, {
    reply: result.reply,
    analysis: result.analysis,
    source: result.source
  }, message2);
});

module.exports = router;
