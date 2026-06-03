/**
 * 本地规则生成器（服务端副本）
 *
 * !!! 本文件是从 miniprogram/utils/recommend.js 镜像过来的副本，
 *     仅作为后端 LLM 失败时的兜底使用。
 *     任何算法 / 数据库改动都需要同步更新两侧文件。
 *
 * 服务端副本：server/src/services/recommend/local-generator.js
 * 小程序原版：miniprogram/utils/recommend.js
 */
var constants = require('./constants');

// ====== 基础代谢（BMR）======
// Mifflin-St Jeor 公式
function calcBMR(profile) {
  if (!profile || !profile.weight_kg || !profile.height_cm || !profile.age) return 0;
  var w = Number(profile.weight_kg);
  var h = Number(profile.height_cm);
  var a = Number(profile.age);
  var bmr = 10 * w + 6.25 * h - 5 * a;
  if (profile.gender === 'male') {
    bmr += 5;
  } else if (profile.gender === 'female') {
    bmr -= 161;
  } else {
    bmr += (5 - 161) / 2;
  }
  return Math.round(bmr);
}

// ====== 总每日能量消耗（TDEE）======
function calcTDEE(profile) {
  var bmr = calcBMR(profile);
  if (!bmr) return 0;
  var factor = 1.2;
  var levels = constants.ACTIVITY_LEVELS || [];
  for (var i = 0; i < levels.length; i++) {
    if (levels[i].id === profile.activity_level) {
      factor = levels[i].factor;
      break;
    }
  }
  return Math.round(bmr * factor);
}

// ====== 根据健康目标调整热量 =======
function calcCalorieTarget(profile) {
  var tdee = calcTDEE(profile);
  if (!tdee) return { tdee: 0, target: 0, delta: 0, goal: profile.health_goal };
  var goal = profile.health_goal || 'maintain';
  var delta = 0;
  if (goal === 'lose_fat') delta = -500;
  else if (goal === 'gain_muscle') delta = 300;
  var target = tdee + delta;
  if (target < 1200) target = 1200; // 安全下限
  return {
    tdee: tdee,
    target: target,
    delta: delta,
    goal: goal
  };
}

// ====== 宏量营养素分配（克数）======
function calcMacros(profile) {
  var calorie = calcCalorieTarget(profile);
  if (!calorie.target) return { protein_g: 0, carb_g: 0, fat_g: 0 };
  var split = (constants.MACRO_SPLIT && constants.MACRO_SPLIT[profile.health_goal])
    ? constants.MACRO_SPLIT[profile.health_goal]
    : constants.MACRO_SPLIT.maintain;
  return {
    protein_g: Math.round((calorie.target * split.protein) / 4),
    carb_g: Math.round((calorie.target * split.carb) / 4),
    fat_g: Math.round((calorie.target * split.fat) / 9)
  };
}

// ====== BMI 计算 =======
function calcBMI(profile) {
  if (!profile || !profile.weight_kg || !profile.height_cm) return null;
  var h = Number(profile.height_cm) / 100;
  if (h <= 0) return null;
  var bmi = Number(profile.weight_kg) / (h * h);
  var category = 'normal';
  if (bmi < 18.5) category = 'underweight';
  else if (bmi >= 24 && bmi < 28) category = 'overweight';
  else if (bmi >= 28) category = 'obese';
  return { value: Math.round(bmi * 10) / 10, category: category };
}

// ====== 过滤菜品：去除禁忌 =======
function filterDishes(restrictions) {
  restrictions = restrictions || [];
  var has = function (id) { return restrictions.indexOf(id) >= 0; };
  var db = constants.DISH_DATABASE || {};
  var result = { staple: [], protein: [], vegetable: [] };
  var keys = ['staple', 'protein', 'vegetable'];
  for (var k = 0; k < keys.length; k++) {
    var cat = keys[k];
    var list = db[cat] || [];
    for (var i = 0; i < list.length; i++) {
      var d = list[i];
      var tags = d.tags || [];
      if (has('vegetarian') && tags.indexOf('high_protein') >= 0 && tags.indexOf('seafood') < 0 && tags.indexOf('vegetarian') < 0) {
        // 素食者：去掉所有非素食蛋白
        if (cat === 'protein') continue;
      }
      if (has('no_seafood') && tags.indexOf('seafood') >= 0) continue;
      if (has('no_high_sugar') && tags.indexOf('low_gi') < 0 && cat === 'staple') continue;
      result[cat].push(d);
    }
  }
  return result;
}

// ====== 过滤运动：去除限制 =======
function filterExercises(limitations) {
  limitations = limitations || [];
  var has = function (id) { return limitations.indexOf(id) >= 0; };
  var list = constants.EXERCISE_DATABASE || [];
  return list.filter(function (e) {
    if (has('knee_problem') && e.impact === 'high') return false;
    if (has('back_problem') && (e.id === 'bodyweight' || e.id === 'machine')) return false;
    if (has('heart_condition') && e.intensity === 'vigorous') return false;
    if (has('beginner') && e.intensity === 'vigorous') return false;
    if (has('no_outdoor') && (e.tags || []).indexOf('indoor') < 0) return false;
    return true;
  });
}

// ====== 随机选择不重复元素 =======
function pickRandom(list, count, exclude) {
  exclude = exclude || [];
  var pool = list.filter(function (x) { return exclude.indexOf(x.id) < 0; });
  if (pool.length <= count) return pool.slice();
  var shuffled = pool.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
  }
  return shuffled.slice(0, count);
}

// ====== 生成每日饮食计划 =======
function generateDietPlan(profile, restrictions) {
  var calorie = calcCalorieTarget(profile);
  if (!calorie.target) return null;
  var dishes = filterDishes(restrictions);
  var ratio = constants.MEAL_CALORIE_RATIO || {};
  var mealTypes = constants.MEAL_TYPES || [];
  var macros = calcMacros(profile);
  var meals = [];
  for (var i = 0; i < mealTypes.length; i++) {
    var mt = mealTypes[i];
    var mealKcal = Math.round(calorie.target * (ratio[mt.id] || 0.25));
    var staple = pickRandom(dishes.staple, 1)[0] || null;
    var proteins = pickRandom(dishes.protein, 1)[0] || null;
    var vegetables = pickRandom(dishes.vegetable, 2);
    var items = [];
    var eaten = { protein: 0, carb: 0, fat: 0 };
    if (staple) {
      items.push({ role: '主食', dish: staple });
      eaten.carb += staple.carb;
      eaten.protein += staple.protein;
      eaten.fat += staple.fat;
    }
    if (proteins) {
      items.push({ role: '蛋白', dish: proteins });
      eaten.protein += proteins.protein;
      eaten.fat += proteins.fat;
    }
    for (var v = 0; v < vegetables.length; v++) {
      items.push({ role: '蔬菜', dish: vegetables[v] });
      eaten.carb += vegetables[v].carb;
      eaten.protein += vegetables[v].protein;
    }
    var mealKcalActual = eaten.protein * 4 + eaten.carb * 4 + eaten.fat * 9;
    meals.push({
      id: mt.id,
      name: mt.name,
      icon: mt.icon,
      targetKcal: mealKcal,
      actualKcal: mealKcalActual,
      items: items
    });
  }
  return {
    date: new Date().toISOString().slice(0, 10),
    targetKcal: calorie.target,
    tdee: calorie.tdee,
    delta: calorie.delta,
    goal: profile.health_goal || 'maintain',
    macros: macros,
    meals: meals
  };
}

// ====== 生成运动计划 =======
function generateExercisePlan(profile, limitations) {
  var goal = profile.health_goal || 'maintain';
  var available = filterExercises(limitations);
  if (!available.length) return null;
  // 按周安排 7 天
  var weekly = [];
  var cardio = available.filter(function (e) { return e.type === 'cardio'; });
  var strength = available.filter(function (e) { return e.type === 'strength'; });
  var flexibility = available.filter(function (e) { return e.type === 'flexibility'; });
  // 频率配置
  var config = {
    lose_fat: { days: 6, cardio: 4, strength: 2, flex: 7 },
    maintain: { days: 5, cardio: 3, strength: 2, flex: 5 },
    gain_muscle: { days: 5, cardio: 2, strength: 3, flex: 5 }
  }[goal];
  // 按类型分配到 7 天
  var dayTemplates = [
    { day: 1, focus: 'cardio' },
    { day: 2, focus: 'strength' },
    { day: 3, focus: 'cardio' },
    { day: 4, focus: 'rest' },
    { day: 5, focus: 'strength' },
    { day: 6, focus: 'cardio' },
    { day: 7, focus: 'flexibility' }
  ];
  for (var i = 0; i < dayTemplates.length; i++) {
    var tpl = dayTemplates[i];
    var items = [];
    if (tpl.focus === 'cardio' && cardio.length) {
      var c = cardio[i % cardio.length];
      items.push(Object.assign({}, c, { plannedMinutes: c.duration || 40 }));
    } else if (tpl.focus === 'strength' && strength.length) {
      var s = strength[i % strength.length];
      items.push(Object.assign({}, s, { plannedMinutes: s.duration || 30 }));
    } else if (tpl.focus === 'flexibility' && flexibility.length) {
      var f = flexibility[0];
      items.push(Object.assign({}, f, { plannedMinutes: f.duration || 20 }));
    } else {
      // 休息日：仅推荐拉伸
      if (flexibility.length) {
        var r = flexibility[flexibility.length - 1];
        items.push(Object.assign({}, r, { plannedMinutes: 10 }));
      }
    }
    weekly.push({
      day: tpl.day,
      focus: tpl.focus,
      items: items,
      totalMinutes: items.reduce(function (sum, it) { return sum + (it.plannedMinutes || 0); }, 0)
    });
  }
  return {
    goal: goal,
    config: config,
    weeklyPlan: weekly
  };
}

// ====== 计算今日应推荐的运动 =======
function getTodayExercise(plan) {
  if (!plan || !plan.weeklyPlan) return null;
  var d = new Date().getDay() || 7;
  for (var i = 0; i < plan.weeklyPlan.length; i++) {
    if (plan.weeklyPlan[i].day === d) return plan.weeklyPlan[i];
  }
  return plan.weeklyPlan[0];
}

// ====== 生成完整推荐 =======
function generateFullPlan(profile, restrictions, limitations) {
  restrictions = restrictions || [];
  limitations = limitations || [];
  var calorie = calcCalorieTarget(profile);
  var bmi = calcBMI(profile);
  var macros = calcMacros(profile);
  var diet = generateDietPlan(profile, restrictions);
  var exercise = generateExercisePlan(profile, limitations);
  return {
    profile: {
      bmi: bmi,
      bmr: calcBMR(profile),
      tdee: calorie.tdee,
      target: calorie.target,
      delta: calorie.delta,
      goal: profile.health_goal || 'maintain'
    },
    macros: macros,
    diet: diet,
    exercise: exercise
  };
}

module.exports = {
  calcBMR: calcBMR,
  calcTDEE: calcTDEE,
  calcCalorieTarget: calcCalorieTarget,
  calcMacros: calcMacros,
  calcBMI: calcBMI,
  filterDishes: filterDishes,
  filterExercises: filterExercises,
  generateDietPlan: generateDietPlan,
  generateExercisePlan: generateExercisePlan,
  getTodayExercise: getTodayExercise,
  generateFullPlan: generateFullPlan
};
