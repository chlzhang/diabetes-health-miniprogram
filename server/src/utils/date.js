'use strict';
/**
 * 日期工具 - 所有时间序列分析都基于本地时区日历日
 */

function pad(n) { return n < 10 ? '0' + n : String(n); }

function toDateKey(d) {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function todayKey() { return toDateKey(new Date()); }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateKey(d);
}

function rangeKeys(days) {
  days = days || 7;
  const list = [];
  for (let i = days - 1; i >= 0; i--) list.push(daysAgo(i));
  return list;
}

function inRange(dateKey, days) {
  return dateKey >= daysAgo(days - 1) && dateKey <= todayKey();
}

module.exports = { pad, toDateKey, todayKey, daysAgo, rangeKeys, inRange };
