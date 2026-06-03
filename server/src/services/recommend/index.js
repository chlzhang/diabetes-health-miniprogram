'use strict';
/**
 * 推荐服务 - 编排 LLM + 分析 + 用户画像
 * 职责：
 * 1) 拉取用户数据
 * 2) 运行分析模块
 * 3) 组装 LLM 上下文
 * 4) 调用 LLM 并解析结果
 * 5) LLM 失败时回退到基于规则的本地方案
 */
const store = require('../data/store');
const analysis = require('../analysis');
const llm = require('../llm');

function buildProfile(user) {
  if (!user) return null;
  const h = Number(user.height_cm) || 0;
  const w = Number(user.weight_kg) || 0;
  const age = Number(user.age) || 0;
  const bmi = h > 0 && w > 0 ? Math.round(w / Math.pow(h / 100, 2) * 10) / 10 : 0;
  // BMR (Mifflin-St Jeor)
  let bmr = 0;
  if (w && h && age) {
    bmr = 10 * w + 6.25 * h - 5 * age;
    bmr += user.gender === 'female' ? -161 : 5;
  }
  const factorMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  const factor = factorMap[user.activity_level] || 1.2;
  const tdee = Math.round(bmr * factor);
  let target = tdee;
  let delta = 0;
  if (user.health_goal === 'lose_fat') { delta = -500; target -= 500; }
  else if (user.health_goal === 'gain_muscle') { delta = 300; target += 300; }
  if (target < 1200) target = 1200;
  // 宏量分配
  const splitMap = {
    lose_fat: { protein: 0.30, carb: 0.40, fat: 0.30 },
    maintain: { protein: 0.25, carb: 0.50, fat: 0.25 },
    gain_muscle: { protein: 0.30, carb: 0.50, fat: 0.20 }
  };
  const split = splitMap[user.health_goal || 'maintain'];
  const macros = {
    protein_g: Math.round(target * split.protein / 4),
    carb_g: Math.round(target * split.carb / 4),
    fat_g: Math.round(target * split.fat / 9)
  };
  return {
    height_cm: h, weight_kg: w, age: age,
    gender: user.gender || 'unspecified',
    activity_level: user.activity_level || 'sedentary',
    health_goal: user.health_goal || 'maintain',
    bmi: bmi,
    bmr: Math.round(bmr),
    tdee: tdee,
    target_kcal: target,
    delta: delta,
    macros: macros
  };
}

function buildContext(userId, days) {
  days = days || 7;
  const user = store.getUser(userId);
  if (!user) return { error: 'USER_NOT_FOUND', userId: userId };
  const meals = store.findByUserInRange('meals', userId, days);
  const exercises = store.findByUserInRange('exercises', userId, days);
  const bloodSugars = store.findByUserInRange('bloodSugars', userId, days);
  const profile = buildProfile(user);
  const overview = analysis.overview.analyze(meals, exercises, bloodSugars, days);
  const preferences = {
    dietary_restrictions: user.dietary_restrictions || [],
    exercise_limitations: user.exercise_limitations || []
  };
  return {
    profile: profile,
    preferences: preferences,
    analysis: overview,
    targets: {
      kcal: profile.target_kcal,
      macros: profile.macros
    },
    rawCounts: { meals: meals.length, exercises: exercises.length, bloodSugars: bloodSugars.length }
  };
}

async function generateDiet(userId, options) {
  options = options || {};
  const ctx = buildContext(userId, options.days);
  if (ctx.error) return ctx;
  const messages = [
    { role: 'system', content: llm.prompts.SYSTEM_PROMPT },
    { role: 'user', content: llm.prompts.buildDietPlanPrompt(ctx) }
  ];
  try {
    const res = await llm.chat(messages, { requireJson: true, context: ctx });
    return { ok: true, source: 'llm', model: res.model, plan: res.parsed, analysis: ctx.analysis, targets: ctx.targets };
  } catch (e) {
    return { ok: false, source: 'fallback', error: e.message, analysis: ctx.analysis, targets: ctx.targets };
  }
}

async function generateExercise(userId, options) {
  options = options || {};
  const ctx = buildContext(userId, options.days);
  if (ctx.error) return ctx;
  const messages = [
    { role: 'system', content: llm.prompts.SYSTEM_PROMPT },
    { role: 'user', content: llm.prompts.buildExercisePlanPrompt(ctx) }
  ];
  try {
    const res = await llm.chat(messages, { requireJson: true, context: ctx });
    return { ok: true, source: 'llm', model: res.model, plan: res.parsed, analysis: ctx.analysis };
  } catch (e) {
    return { ok: false, source: 'fallback', error: e.message, analysis: ctx.analysis };
  }
}

async function generateComprehensive(userId, options) {
  options = options || {};
  const ctx = buildContext(userId, options.days);
  if (ctx.error) return ctx;
  const messages = [
    { role: 'system', content: llm.prompts.SYSTEM_PROMPT },
    { role: 'user', content: llm.prompts.buildComprehensivePlanPrompt(ctx) }
  ];
  try {
    const res = await llm.chat(messages, { requireJson: true, context: ctx });
    return { ok: true, source: 'llm', model: res.model, plan: res.parsed, analysis: ctx.analysis, targets: ctx.targets };
  } catch (e) {
    return { ok: false, source: 'fallback', error: e.message, analysis: ctx.analysis, targets: ctx.targets };
  }
}

async function chat(userId, history, userMessage) {
  const ctx = buildContext(userId, 7);
  const messages = [
    { role: 'system', content: llm.prompts.SYSTEM_PROMPT },
    { role: 'user', content: llm.prompts.buildChatPrompt(ctx, history || [], userMessage) }
  ];
  try {
    const res = await llm.chat(messages, { requireJson: true, context: ctx });
    return { ok: true, source: 'llm', model: res.model, reply: res.parsed, analysis: ctx.analysis };
  } catch (e) {
    return { ok: false, source: 'fallback', error: e.message, analysis: ctx.analysis };
  }
}

module.exports = {
  buildContext: buildContext,
  generateDiet: generateDiet,
  generateExercise: generateExercise,
  generateComprehensive: generateComprehensive,
  chat: chat
};
