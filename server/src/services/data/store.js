'use strict';
/**
 * 文件型数据存储
 * - users.json: 用户资料 + 偏好
 * - meals.json: 饮食记录（按用户分块）
 * - exercises.json: 运动记录
 * - blood_sugars.json: 血糖记录
 *
 * 该模块是数据访问层（Repository），所有业务逻辑都通过它读写数据。
 * 后续可替换为 MySQL/MongoDB/PostgreSQL 实现，对外保持一致接口。
 */
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const FILES = {
  users: 'users.json',
  meals: 'meals.json',
  exercises: 'exercises.json',
  bloodSugars: 'blood_sugars.json'
};

if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });

function readJson(file) {
  const fp = path.join(config.dataDir, file);
  if (!fs.existsSync(fp)) return {};
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { return {}; }
}
function writeJson(file, data) {
  const fp = path.join(config.dataDir, file);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
}

function listAll(type) {
  const data = readJson(FILES[type]);
  return Object.values(data);
}

function findByUser(type, userId) {
  return listAll(type).filter(function (r) { return r.user_id === userId; });
}

function findByUserInRange(type, userId, days) {
  const start = require('../../utils/date').daysAgo(days - 1);
  return findByUser(type, userId)
    .filter(function (r) { return (r.date || '').slice(0, 10) >= start; })
    .sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });
}

function getUser(userId) {
  const users = readJson(FILES.users);
  return users[userId] || null;
}

function upsertUser(userId, partial) {
  const users = readJson(FILES.users);
  users[userId] = Object.assign({}, users[userId] || { _id: userId, created_at: new Date().toISOString() }, partial, { updated_at: new Date().toISOString() });
  writeJson(FILES.users, users);
  return users[userId];
}

function listUsers() { return listAll('users'); }

module.exports = {
  getUser,
  upsertUser,
  listUsers,
  findByUser,
  findByUserInRange,
  listAll,
  // 直接读原始数据，便于测试脚本
  _readRaw: readJson,
  _writeRaw: writeJson
};
