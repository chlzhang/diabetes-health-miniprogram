'use strict';
/**
 * 数据分析路由（无需 LLM，纯统计）
 * - GET /api/v1/analysis/diet?userId=xxx&days=7
 * - GET /api/v1/analysis/exercise?userId=xxx&days=7
 * - GET /api/v1/analysis/bloodsugar?userId=xxx&days=7
 * - GET /api/v1/analysis/overview?userId=xxx&days=7
 * - GET /api/v1/analysis/records/:userId?type=meals&days=7   原始记录
 */
const express = require('express');
const router = express.Router();
const store = require('../services/data/store');
const analysis = require('../services/analysis');
const { ok, fail, codes } = require('../utils/response');

function validateQuery(req) {
  const userId = req.query.userId;
  if (!userId) return null;
  return String(userId);
}

function ensureUser(userId, res) {
  const user = store.getUser(userId);
  if (!user) {
    fail(res, codes.NOT_FOUND, '用户不存在: ' + userId);
    return null;
  }
  return user;
}

function getDays(req) {
  return Math.max(1, Math.min(90, parseInt(req.query.days || 7, 10)));
}

router.get('/diet', function (req, res) {
  const userId = validateQuery(req);
  if (!userId) return fail(res, codes.PARAM_INVALID, '缺少 userId');
  if (!ensureUser(userId, res)) return;
  const days = getDays(req);
  const meals = store.findByUserInRange('meals', userId, days);
  return ok(res, analysis.diet.analyze(meals, days));
});

router.get('/exercise', function (req, res) {
  const userId = validateQuery(req);
  if (!userId) return fail(res, codes.PARAM_INVALID, '缺少 userId');
  if (!ensureUser(userId, res)) return;
  const days = getDays(req);
  const list = store.findByUserInRange('exercises', userId, days);
  return ok(res, analysis.exercise.analyze(list, days));
});

router.get('/bloodsugar', function (req, res) {
  const userId = validateQuery(req);
  if (!userId) return fail(res, codes.PARAM_INVALID, '缺少 userId');
  if (!ensureUser(userId, res)) return;
  const days = getDays(req);
  const list = store.findByUserInRange('bloodSugars', userId, days);
  return ok(res, analysis.bloodSugar.analyze(list, days));
});

router.get('/overview', function (req, res) {
  const userId = validateQuery(req);
  if (!userId) return fail(res, codes.PARAM_INVALID, '缺少 userId');
  if (!ensureUser(userId, res)) return;
  const days = getDays(req);
  const meals = store.findByUserInRange('meals', userId, days);
  const exercises = store.findByUserInRange('exercises', userId, days);
  const bss = store.findByUserInRange('bloodSugars', userId, days);
  return ok(res, analysis.overview.analyze(meals, exercises, bss, days));
});

router.get('/records/:userId', function (req, res) {
  const userId = req.params.userId;
  if (!ensureUser(userId, res)) return;
  const type = (req.query.type || 'meals').toLowerCase();
  const days = getDays(req);
  const mapping = { meals: 'meals', exercises: 'exercises', bloodsugars: 'bloodSugars', blood_sugars: 'bloodSugars' };
  if (!mapping[type]) return fail(res, codes.PARAM_INVALID, 'type 必须为 meals/exercises/bloodsugars');
  return ok(res, { items: store.findByUserInRange(mapping[type], userId, days), total: store.findByUserInRange(mapping[type], userId, days).length });
});

module.exports = router;
