'use strict';
/**
 * 运动数据分析
 */
const { rangeKeys, inRange } = require('../../utils/date');

function analyze(exercises, days) {
  days = days || 7;
  const range = rangeKeys(days);
  const inWindow = exercises.filter(function (e) { return inRange((e.date || '').slice(0, 10), days); });
  const byDate = {};
  range.forEach(function (k) { byDate[k] = []; });
  inWindow.forEach(function (e) { const k = (e.date || '').slice(0, 10); if (byDate[k]) byDate[k].push(e); });

  // 1) 每日分钟数
  const dailyMinutes = range.map(function (k) {
    return (byDate[k] || []).reduce(function (s, e) { return s + (e.duration_min || 0); }, 0);
  });
  const totalMinutes = dailyMinutes.reduce(function (s, m) { return s + m; }, 0);
  const activeDays = dailyMinutes.filter(function (m) { return m > 0; }).length;
  const weeklyGoal = 150;
  const goalRatio = Math.min(1, totalMinutes / weeklyGoal);
  const goalPercent = Math.round(goalRatio * 100);

  // 2) 强度分布
  const intensityDist = { light: 0, moderate: 0, vigorous: 0 };
  inWindow.forEach(function (e) {
    if (intensityDist[e.intensity] !== undefined) intensityDist[e.intensity]++;
  });
  const intensityMinutes = { light: 0, moderate: 0, vigorous: 0 };
  inWindow.forEach(function (e) {
    if (intensityMinutes[e.intensity] !== undefined) intensityMinutes[e.intensity] += (e.duration_min || 0);
  });

  // 3) 类型多样性
  const typeCount = {};
  inWindow.forEach(function (e) { typeCount[e.sport_type] = (typeCount[e.sport_type] || 0) + 1; });
  const varietyScore = Object.keys(typeCount).length;

  // 4) 消耗热量
  const totalKcal = inWindow.reduce(function (s, e) { return s + (e.calories || 0); }, 0);

  // 5) 连续天数（从今天往回数）
  let streak = 0;
  for (let i = dailyMinutes.length - 1; i >= 0; i--) {
    if (dailyMinutes[i] >= 30) streak++;
    else if (i === dailyMinutes.length - 1) continue; // 今天未完成不打断
    else break;
  }

  // 6) 一周中哪些天最活跃
  const weekdayMinutes = [0, 0, 0, 0, 0, 0, 0]; // 周日-周六
  inWindow.forEach(function (e) {
    const d = new Date(e.date);
    weekdayMinutes[d.getDay()] += (e.duration_min || 0);
  });

  // 7) 问题
  const issues = [];
  if (totalMinutes < weeklyGoal * 0.6) issues.push('本周运动量不足目标的 60%');
  if (activeDays < 3) issues.push('运动天数偏少（< 3 天）');
  if (intensityDist.vigorous === 0 && days >= 7) issues.push('缺少高强度运动，建议适度加入力量训练');
  if (varietyScore <= 1 && inWindow.length > 3) issues.push('运动类型单一，建议多样化');
  if (activeDays > 0 && totalMinutes / activeDays < 15) issues.push('单次运动时长偏短');

  return {
    rangeDays: days,
    totalMinutes: totalMinutes,
    avgMinutes: days > 0 ? Math.round(totalMinutes / days) : 0,
    activeDays: activeDays,
    goalMinutes: weeklyGoal,
    goalPercent: goalPercent,
    streak: streak,
    intensityDist: intensityDist,
    intensityMinutes: intensityMinutes,
    varietyScore: varietyScore,
    typeCount: typeCount,
    totalKcal: totalKcal,
    dailyMinutes: dailyMinutes,
    weekdayMinutes: weekdayMinutes,
    issues: issues
  };
}

module.exports = { analyze };
