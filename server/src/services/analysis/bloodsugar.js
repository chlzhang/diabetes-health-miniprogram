'use strict';
/**
 * 血糖数据分析
 * - TIR (Time in Range) 目标区间：3.9 - 7.8 mmol/L
 * - 分时段统计：空腹 / 餐后2h / 睡前
 * - 趋势：最近 3 天 vs 之前
 * - 异常次数
 */
const { rangeKeys, inRange } = require('../../utils/date');

const STANDARDS = {
  fasting: { normal: 6.1, low: 3.9, label: '空腹' },
  post_meal: { normal: 7.8, low: 3.9, label: '餐后2h' },
  bedtime: { normal: 7.0, low: 3.9, label: '睡前' }
};

function classify(value, tp) {
  const std = STANDARDS[tp] || STANDARDS.fasting;
  if (value < std.low) return 'low';
  if (value >= std.normal) return 'high';
  return 'normal';
}

function analyze(records, days) {
  days = days || 7;
  const range = rangeKeys(days);
  const inWindow = records.filter(function (r) { return inRange((r.date || '').slice(0, 10), days); });

  // 1) 总体 TIR
  const totalCount = inWindow.length;
  const lowCount = inWindow.filter(function (r) { return r.value < 3.9; }).length;
  const highCount = inWindow.filter(function (r) { return classify(r.value, r.time_point) === 'high'; }).length;
  const normalCount = totalCount - lowCount - highCount;
  const tirPercent = totalCount ? Math.round(normalCount / totalCount * 100) : 0;

  // 2) 分时段均值
  const byType = { fasting: [], post_meal: [], bedtime: [] };
  inWindow.forEach(function (r) { if (byType[r.time_point]) byType[r.time_point].push(r.value); });
  const typeStats = {};
  Object.keys(byType).forEach(function (tp) {
    const arr = byType[tp];
    const std = STANDARDS[tp];
    if (!arr.length) { typeStats[tp] = { count: 0, avg: 0, max: 0, min: 0, standard: std, highRate: 0, lowRate: 0 }; return; }
    const avg = arr.reduce(function (s, v) { return s + v; }, 0) / arr.length;
    const high = arr.filter(function (v) { return v >= std.normal; }).length;
    const low = arr.filter(function (v) { return v < std.low; }).length;
    typeStats[tp] = {
      count: arr.length,
      avg: Math.round(avg * 10) / 10,
      max: Math.max.apply(null, arr),
      min: Math.min.apply(null, arr),
      standard: std,
      highRate: Math.round(high / arr.length * 100),
      lowRate: Math.round(low / arr.length * 100)
    };
  });

  // 3) 每日均值趋势
  const dailyAvg = range.map(function (k) {
    const list = inWindow.filter(function (r) { return (r.date || '').slice(0, 10) === k; });
    if (!list.length) return null;
    return Math.round(list.reduce(function (s, r) { return s + r.value; }, 0) / list.length * 10) / 10;
  });
  const trend = computeTrend(dailyAvg);

  // 4) 波动性 (变异系数)
  const allValues = inWindow.map(function (r) { return r.value; });
  const variability = computeVariability(allValues);

  // 5) 异常模式
  const issues = [];
  if (totalCount === 0) issues.push('近 ' + days + ' 天无血糖记录');
  if (tirPercent > 0 && tirPercent < 60) issues.push('血糖达标率偏低（< 60%）');
  if (typeStats.fasting && typeStats.fasting.highRate > 30) issues.push('空腹血糖偏高频率 > 30%');
  if (typeStats.post_meal && typeStats.post_meal.highRate > 40) issues.push('餐后 2 小时血糖偏高频率 > 40%');
  if (typeStats.fasting && typeStats.fasting.lowRate > 10) issues.push('存在低血糖风险');
  if (variability.stdDev > 1.5) issues.push('血糖波动较大（标准差 > 1.5）');
  if (trend.direction === 'increasing' && trend.delta > 0.5) issues.push('近期血糖有上升趋势');

  return {
    rangeDays: days,
    totalRecords: totalCount,
    tirPercent: tirPercent,
    normalCount: normalCount,
    highCount: highCount,
    lowCount: lowCount,
    typeStats: typeStats,
    dailyAvg: dailyAvg,
    trend: trend,
    variability: variability,
    issues: issues
  };
}

function computeTrend(dailyAvg) {
  const recorded = dailyAvg.filter(function (v) { return v !== null; });
  if (recorded.length < 3) return { direction: 'insufficient_data', delta: 0 };
  const half = Math.floor(recorded.length / 2);
  const early = recorded.slice(0, half);
  const late = recorded.slice(half);
  const earlyAvg = early.reduce(function (s, v) { return s + v; }, 0) / early.length;
  const lateAvg = late.reduce(function (s, v) { return s + v; }, 0) / late.length;
  const delta = Math.round((lateAvg - earlyAvg) * 10) / 10;
  if (Math.abs(delta) < 0.3) return { direction: 'stable', delta: delta };
  return { direction: delta > 0 ? 'increasing' : 'decreasing', delta: delta };
}

function computeVariability(values) {
  if (values.length < 2) return { stdDev: 0, cv: 0 };
  const mean = values.reduce(function (s, v) { return s + v; }, 0) / values.length;
  const variance = values.reduce(function (s, v) { return s + (v - mean) * (v - mean); }, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return {
    stdDev: Math.round(stdDev * 100) / 100,
    cv: mean > 0 ? Math.round(stdDev / mean * 1000) / 10 : 0
  };
}

module.exports = { analyze, classify, STANDARDS };
