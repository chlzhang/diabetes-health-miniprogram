'use strict';
/**
 * 综合分析 - 跨模块关联
 * - 餐后血糖响应（某餐的碳水 → 餐后 2h 血糖）
 * - 运动对次日空腹血糖的影响
 * - 总体依从评分
 */
const { rangeKeys, inRange } = require('../../utils/date');
const dietModule = require('./diet');
const exerciseModule = require('./exercise');
const bsModule = require('./bloodsugar');

function analyze(meals, exercises, bloodSugars, days) {
  days = days || 7;
  const diet = dietModule.analyze(meals, days);
  const exercise = exerciseModule.analyze(exercises, days);
  const bs = bsModule.analyze(bloodSugars, days);

  // 1) 餐后血糖响应（简化版）
  const postMealResponse = computePostMealResponse(meals, bloodSugars, days);

  // 2) 运动 → 血糖 影响
  const exerciseBsEffect = computeExerciseBsEffect(exercises, bloodSugars, days);

  // 3) 综合依从评分（加权）
  const overallScore = computeOverallScore(diet, exercise, bs);

  // 4) 风险等级
  const riskLevel = assessRisk(bs, diet, exercise);

  // 5) 关键洞察（高优先级给 LLM）
  const insights = collectInsights(diet, exercise, bs, postMealResponse, exerciseBsEffect);

  return {
    days: days,
    diet: diet,
    exercise: exercise,
    bloodSugar: bs,
    postMealResponse: postMealResponse,
    exerciseBsEffect: exerciseBsEffect,
    overallScore: overallScore,
    riskLevel: riskLevel,
    insights: insights
  };
}

function computePostMealResponse(meals, bloodSugars, days) {
  const range = rangeKeys(days);
  const pairs = [];
  range.forEach(function (k) {
    const dayMeals = meals.filter(function (m) { return (m.date || '').slice(0, 10) === k; });
    dayMeals.forEach(function (m) {
      // 找餐后 1.5-2.5 小时的血糖
      const mealHour = m.record_hour != null ? m.record_hour : 12;
      const post = bloodSugars.find(function (r) {
        if ((r.date || '').slice(0, 10) !== k) return false;
        if (r.time_point !== 'post_meal') return false;
        const rh = r.record_hour != null ? r.record_hour : 14;
        return Math.abs(rh - (mealHour + 2)) <= 1;
      });
      if (post) {
        const riskFactor = (m.has_sweet_food || m.has_sweet_drink) ? 'high_carb' : 'normal';
        pairs.push({
          date: k,
          meal_type: m.meal_type,
          value: post.value,
          has_sweet: m.has_sweet_food || m.has_sweet_drink,
          main_food: m.main_food_amount || 0,
          riskFactor: riskFactor
        });
      }
    });
  });
  if (!pairs.length) return { samples: 0, avgPostMeal: 0, highRate: 0, byMeal: {} };
  const highCount = pairs.filter(function (p) { return p.value >= 7.8; }).length;
  const byMeal = {};
  pairs.forEach(function (p) {
    if (!byMeal[p.meal_type]) byMeal[p.meal_type] = { total: 0, sum: 0, high: 0 };
    byMeal[p.meal_type].total++;
    byMeal[p.meal_type].sum += p.value;
    if (p.value >= 7.8) byMeal[p.meal_type].high++;
  });
  Object.keys(byMeal).forEach(function (k) {
    const b = byMeal[k];
    b.avg = Math.round(b.sum / b.total * 10) / 10;
    b.highRate = Math.round(b.high / b.total * 100);
  });
  return {
    samples: pairs.length,
    avgPostMeal: Math.round(pairs.reduce(function (s, p) { return s + p.value; }, 0) / pairs.length * 10) / 10,
    highRate: Math.round(highCount / pairs.length * 100),
    byMeal: byMeal
  };
}

function computeExerciseBsEffect(exercises, bloodSugars, days) {
  const range = rangeKeys(days);
  const withExerciseDays = [];
  const noExerciseDays = [];
  range.forEach(function (k) {
    const exMin = exercises.filter(function (e) { return (e.date || '').slice(0, 10) === k; })
      .reduce(function (s, e) { return s + (e.duration_min || 0); }, 0);
    const fasting = bloodSugars.find(function (r) {
      return (r.date || '').slice(0, 10) === k && r.time_point === 'fasting';
    });
    if (!fasting) return;
    (exMin >= 30 ? withExerciseDays : noExerciseDays).push(fasting.value);
  });
  if (!withExerciseDays.length || !noExerciseDays.length) {
    return { hasData: false, msg: '样本不足，无法比较' };
  }
  const avgEx = withExerciseDays.reduce(function (s, v) { return s + v; }, 0) / withExerciseDays.length;
  const avgNoEx = noExerciseDays.reduce(function (s, v) { return s + v; }, 0) / noExerciseDays.length;
  return {
    hasData: true,
    avgFastingWithExercise: Math.round(avgEx * 10) / 10,
    avgFastingWithoutExercise: Math.round(avgNoEx * 10) / 10,
    delta: Math.round((avgEx - avgNoEx) * 10) / 10,
    sampleSize: { exerciseDays: withExerciseDays.length, noExerciseDays: noExerciseDays.length }
  };
}

function computeOverallScore(diet, exercise, bs) {
  // 满分 100
  const dietScore = diet.adherence || 0;
  const exGoal = Math.min(100, exercise.goalPercent || 0);
  const bsScore = bs.tirPercent || 0;
  return {
    total: Math.round(dietScore * 0.35 + exGoal * 0.35 + bsScore * 0.30),
    components: { diet: dietScore, exercise: exGoal, bloodSugar: bsScore },
    weight: { diet: '35%', exercise: '35%', bloodSugar: '30%' }
  };
}

function assessRisk(bs, diet, exercise) {
  if (bs.tirPercent < 50 || (bs.trend.direction === 'increasing' && bs.trend.delta > 0.8)) {
    return { level: 'high', label: '高风险', reason: '血糖达标率低或趋势恶化' };
  }
  if (bs.tirPercent < 70 || bs.variability.stdDev > 1.5 || exercise.goalPercent < 50) {
    return { level: 'medium', label: '中等风险', reason: '存在多项待改善指标' };
  }
  return { level: 'low', label: '低风险', reason: '整体指标良好' };
}

function collectInsights(diet, exercise, bs, postMeal, exEffect) {
  const list = [];
  diet.issues.forEach(function (i) { list.push({ module: 'diet', severity: 'info', message: i }); });
  exercise.issues.forEach(function (i) { list.push({ module: 'exercise', severity: 'info', message: i }); });
  bs.issues.forEach(function (i) { list.push({ module: 'bloodSugar', severity: 'warn', message: i }); });
  if (postMeal.highRate > 50) {
    list.push({ module: 'diet', severity: 'warn', message: '餐后血糖超标率 ' + postMeal.highRate + '%' });
  }
  if (exEffect.hasData && exEffect.delta < -0.3) {
    list.push({ module: 'exercise', severity: 'positive', message: '运动日空腹血糖比不运动日低 ' + Math.abs(exEffect.delta) + ' mmol/L' });
  }
  if (bs.trend.direction === 'decreasing' && bs.trend.delta < -0.3) {
    list.push({ module: 'bloodSugar', severity: 'positive', message: '近期血糖呈下降趋势' });
  }
  return list;
}

module.exports = { analyze };
