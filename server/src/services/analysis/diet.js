'use strict';
/**
 * 饮食数据分析
 * 输入：meals 数组
 * 输出：餐次分布、健康评级、估算热量、宏量营养素、依从率、问题点
 */
const { rangeKeys, inRange } = require('../../utils/date');

// 估算每餐热量（与小程序 tracking 页保持一致）
function estimateMealKcal(m) {
  let kcal = 200 + (m.has_vegetable ? 50 : 0) + (m.has_protein ? 100 : 0);
  if (m.has_sweet_food) kcal += 150;
  if (m.has_sweet_drink) kcal += 100;
  if (m.main_food_amount && m.main_food_amount > 0) {
    kcal = Math.round(kcal * (m.main_food_amount / 150));
  }
  return kcal;
}

function analyze(meals, days) {
  days = days || 7;
  const range = rangeKeys(days);
  const inWindow = meals.filter(function (m) { return inRange((m.date || '').slice(0, 10), days); });
  const byDate = {};
  range.forEach(function (k) { byDate[k] = []; });
  inWindow.forEach(function (m) { const k = (m.date || '').slice(0, 10); if (byDate[k]) byDate[k].push(m); });

  // 1) 餐次分布
  const mealTypeDist = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  inWindow.forEach(function (m) { if (mealTypeDist[m.meal_type] !== undefined) mealTypeDist[m.meal_type]++; });

  // 2) 健康评级
  const healthDist = { good: 0, ok: 0, warn: 0 };
  inWindow.forEach(function (m) {
    const lvl = m.health_level || (m.healthLevel) || 'ok';
    if (healthDist[lvl] !== undefined) healthDist[lvl]++;
  });

  // 3) 每日热量估算
  const dailyKcal = range.map(function (k) {
    const list = byDate[k] || [];
    return list.reduce(function (s, m) { return s + estimateMealKcal(m); }, 0);
  });
  const recordedDays = dailyKcal.filter(function (k) { return k > 0; });
  const avgKcal = recordedDays.length ? Math.round(recordedDays.reduce(function (s, k) { return s + k; }, 0) / recordedDays.length) : 0;
  const maxKcal = recordedDays.length ? Math.max.apply(null, recordedDays) : 0;
  const minKcal = recordedDays.length ? Math.min.apply(null, recordedDays) : 0;

  // 4) 结构化指标
  let vegDays = 0, proteinDays = 0, sweetDays = 0, sweetDrinkDays = 0;
  Object.keys(byDate).forEach(function (k) {
    const list = byDate[k];
    if (list.some(function (m) { return m.has_vegetable; })) vegDays++;
    if (list.some(function (m) { return m.has_protein; })) proteinDays++;
    if (list.some(function (m) { return m.has_sweet_food; })) sweetDays++;
    if (list.some(function (m) { return m.has_sweet_drink; })) sweetDrinkDays++;
  });

  // 5) 依从率：每天至少 2 餐才算合规
  const recordedAllDays = range.filter(function (k) { return byDate[k].length > 0; }).length;
  const adherentDays = range.filter(function (k) { return byDate[k].length >= 2; }).length;
  const adherence = range.length ? Math.round(adherentDays / range.length * 100) : 0;

  // 6) 趋势（最近 3 天 vs 之前 4 天）
  const trend = computeTrend(dailyKcal);

  // 7) 问题识别
  const issues = [];
  if (mealTypeDist.breakfast < days * 0.5) issues.push('早餐缺失频率较高');
  if (sweetDays >= days * 0.4) issues.push('含甜食频率偏高（>40% 天数）');
  if (sweetDrinkDays >= days * 0.2) issues.push('含糖饮料摄入较多（>20% 天数）');
  if (proteinDays < days * 0.6) issues.push('优质蛋白摄入不足');
  if (vegDays < days * 0.6) issues.push('蔬菜摄入不足');
  if (healthDist.warn / Math.max(1, inWindow.length) > 0.4) issues.push('健康评级"注意"占比较高');
  if (avgKcal > 0 && avgKcal > 2400) issues.push('平均热量偏高');

  return {
    rangeDays: days,
    totalMeals: inWindow.length,
    recordedDays: recordedAllDays,
    adherentDays: adherentDays,
    adherence: adherence,
    mealTypeDist: mealTypeDist,
    healthDist: healthDist,
    kcal: { avg: avgKcal, max: maxKcal, min: minKcal, daily: dailyKcal },
    structure: { vegDays: vegDays, proteinDays: proteinDays, sweetDays: sweetDays, sweetDrinkDays: sweetDrinkDays },
    trend: trend,
    issues: issues
  };
}

function computeTrend(dailyKcal) {
  const recorded = dailyKcal.filter(function (k) { return k > 0; });
  if (recorded.length < 4) return { direction: 'insufficient_data', delta: 0 };
  const half = Math.floor(recorded.length / 2);
  const early = recorded.slice(0, half);
  const late = recorded.slice(half);
  const earlyAvg = early.reduce(function (s, k) { return s + k; }, 0) / early.length;
  const lateAvg = late.reduce(function (s, k) { return s + k; }, 0) / late.length;
  const delta = Math.round(lateAvg - earlyAvg);
  if (Math.abs(delta) < 100) return { direction: 'stable', delta: delta };
  return { direction: delta > 0 ? 'increasing' : 'decreasing', delta: delta };
}

module.exports = { analyze, estimateMealKcal };
