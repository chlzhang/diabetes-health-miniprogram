'use strict';
/**
 * 用户与记录管理（开发/调试用，亦可被小程序在登录后调用做数据同步）
 * - GET    /api/v1/user/:userId                获取用户
 * - PUT    /api/v1/user/:userId                创建/更新用户
 * - POST   /api/v1/user/:userId/meals          批量上报饮食
 * - POST   /api/v1/user/:userId/exercises      批量上报运动
 * - POST   /api/v1/user/:userId/bloodsugars    批量上报血糖
 */
const express = require('express');
const router = express.Router();
const store = require('../services/data/store');
const { ok, fail, codes } = require('../utils/response');

router.get('/:userId', function (req, res) {
  const user = store.getUser(req.params.userId);
  if (!user) return fail(res, codes.NOT_FOUND, '用户不存在');
  return ok(res, user);
});

router.put('/:userId', function (req, res) {
  const partial = req.body || {};
  if (!partial.height_cm || !partial.weight_kg || !partial.age) {
    return fail(res, codes.PARAM_INVALID, '需要 height_cm / weight_kg / age');
  }
  const user = store.upsertUser(req.params.userId, partial);
  return ok(res, user, '已保存');
});

router.post('/:userId/meals', function (req, res) {
  const list = (req.body && req.body.items) || [];
  if (!Array.isArray(list) || !list.length) return fail(res, codes.PARAM_INVALID, '缺少 items');
  appendAll('meals', req.params.userId, list);
  return ok(res, { count: list.length }, 'ok');
});

router.post('/:userId/exercises', function (req, res) {
  const list = (req.body && req.body.items) || [];
  if (!Array.isArray(list) || !list.length) return fail(res, codes.PARAM_INVALID, '缺少 items');
  appendAll('exercises', req.params.userId, list);
  return ok(res, { count: list.length }, 'ok');
});

router.post('/:userId/bloodsugars', function (req, res) {
  const list = (req.body && req.body.items) || [];
  if (!Array.isArray(list) || !list.length) return fail(res, codes.PARAM_INVALID, '缺少 items');
  appendAll('bloodSugars', req.params.userId, list);
  return ok(res, { count: list.length }, 'ok');
});

function appendAll(type, userId, items) {
  const fileMap = { meals: 'meals.json', exercises: 'exercises.json', bloodSugars: 'blood_sugars.json' };
  const data = store._readRaw(fileMap[type]);
  items.forEach(function (it) {
    const id = (type.charAt(0)) + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const date = (it.date || new Date().toISOString().slice(0, 10));
    data[id] = Object.assign({ _id: id, user_id: userId, date: date, created_at: new Date().toISOString() }, it);
  });
  store._writeRaw(fileMap[type], data);
}

module.exports = router;
