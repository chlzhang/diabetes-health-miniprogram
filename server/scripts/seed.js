'use strict';
/**
 * 种子数据 - 写入 3 个示例用户 + 近 14 天的完整数据
 *   node scripts/seed.js
 */
const path = require('path');
const fs = require('fs');
const config = require(path.resolve(__dirname, '..', 'src', 'config'));
const store = require(path.resolve(__dirname, '..', 'src', 'services', 'data', 'store'));
const { pad, toDateKey } = require(path.resolve(__dirname, '..', 'src', 'utils', 'date'));

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const MEAL_OPTIONS = [
  { meal_type: 'breakfast', main_food_amount: 120, has_vegetable: true, has_protein: true, has_sweet_food: false, has_sweet_drink: false, health_level: 'good', description: '杂粮粥 + 鸡蛋 + 凉拌黄瓜' },
  { meal_type: 'breakfast', main_food_amount: 80,  has_vegetable: false, has_protein: true, has_sweet_food: false, has_sweet_drink: false, health_level: 'ok', description: '全麦面包 + 牛奶' },
  { meal_type: 'breakfast', main_food_amount: 0,   has_vegetable: false, has_protein: false, has_sweet_food: true,  has_sweet_drink: true,  health_level: 'warn', description: '甜豆浆 + 蛋糕' },
  { meal_type: 'lunch',     main_food_amount: 180, has_vegetable: true, has_protein: true, has_sweet_food: false, has_sweet_drink: false, health_level: 'good', description: '杂粮饭 + 清蒸鱼 + 西兰花' },
  { meal_type: 'lunch',     main_food_amount: 220, has_vegetable: true, has_protein: true, has_sweet_food: false, has_sweet_drink: false, health_level: 'ok', description: '米饭 + 红烧鸡 + 蔬菜' },
  { meal_type: 'lunch',     main_food_amount: 250, has_vegetable: false, has_protein: true, has_sweet_food: false, has_sweet_drink: true,  health_level: 'warn', description: '盖浇饭 + 含糖饮料' },
  { meal_type: 'dinner',    main_food_amount: 150, has_vegetable: true, has_protein: true, has_sweet_food: false, has_sweet_drink: false, health_level: 'good', description: '糙米饭 + 豆腐 + 菠菜' },
  { meal_type: 'dinner',    main_food_amount: 200, has_vegetable: true, has_protein: false, has_sweet_food: false, has_sweet_drink: false, health_level: 'ok', description: '面条 + 青菜' },
  { meal_type: 'snack',     main_food_amount: 0,   has_vegetable: false, has_protein: false, has_sweet_food: true, has_sweet_drink: false, health_level: 'warn', description: '饼干点心' },
  { meal_type: 'snack',     main_food_amount: 0,   has_vegetable: false, has_protein: true, has_sweet_food: false, has_sweet_drink: false, health_level: 'good', description: '低脂酸奶' }
];

const EXERCISE_OPTIONS = [
  { sport_type: 'walking',  duration_min: 40, intensity: 'moderate', calories: 152 },
  { sport_type: 'jogging',  duration_min: 30, intensity: 'moderate', calories: 230 },
  { sport_type: 'cycling',  duration_min: 45, intensity: 'moderate', calories: 270 },
  { sport_type: 'swimming', duration_min: 30, intensity: 'moderate', calories: 180 },
  { sport_type: 'yoga',     duration_min: 30, intensity: 'light',    calories: 50 },
  { sport_type: 'strength', duration_min: 40, intensity: 'vigorous', calories: 200 }
];

const USERS = [
  {
    id: 'demo_user_001',
    height_cm: 172, weight_kg: 78, age: 48, gender: 'male', activity_level: 'light', health_goal: 'lose_fat',
    dietary_restrictions: ['no_high_sugar'], exercise_limitations: ['knee_problem']
  },
  {
    id: 'demo_user_002',
    height_cm: 162, weight_kg: 58, age: 52, gender: 'female', activity_level: 'moderate', health_goal: 'maintain',
    dietary_restrictions: ['no_seafood'], exercise_limitations: []
  },
  {
    id: 'demo_user_003',
    height_cm: 178, weight_kg: 68, age: 35, gender: 'male', activity_level: 'sedentary', health_goal: 'gain_muscle',
    dietary_restrictions: [], exercise_limitations: ['beginner']
  }
];

function generateMeals(userId, days, profile) {
  const list = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = toDateKey(d);
    // 1-3 餐
    const mealCount = rand(2, 3);
    const used = new Set();
    for (let m = 0; m < mealCount; m++) {
      let opt;
      let attempts = 0;
      do { opt = pick(MEAL_OPTIONS); attempts++; } while (used.has(opt.meal_type) && attempts < 6);
      used.add(opt.meal_type);
      list.push(Object.assign({ user_id: userId, date: dateStr }, opt, { record_hour: opt.meal_type === 'breakfast' ? 7 : opt.meal_type === 'lunch' ? 12 : opt.meal_type === 'dinner' ? 19 : 15 }));
    }
  }
  return list;
}

function generateExercises(userId, days, profile) {
  const list = [];
  const daysPerWeek = profile.health_goal === 'lose_fat' ? 5 : profile.health_goal === 'maintain' ? 3 : 4;
  for (let i = days - 1; i >= 0; i--) {
    if (Math.random() > daysPerWeek / 7) continue;
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = toDateKey(d);
    const opt = pick(EXERCISE_OPTIONS);
    list.push(Object.assign({ user_id: userId, date: dateStr, record_hour: rand(18, 21) }, opt));
  }
  return list;
}

function generateBloodSugars(userId, days, profile) {
  const list = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = toDateKey(d);
    // 空腹
    const fasting = 5.5 + Math.random() * 1.4; // 5.5-6.9
    list.push({ user_id: userId, date: dateStr, time_point: 'fasting', value: Math.round(fasting * 10) / 10, record_hour: 7 });
    // 餐后 2h
    const postMeal = 6.5 + Math.random() * 2.0; // 6.5-8.5
    list.push({ user_id: userId, date: dateStr, time_point: 'post_meal', value: Math.round(postMeal * 10) / 10, record_hour: 14 });
    // 睡前（80% 概率）
    if (Math.random() < 0.8) {
      const bed = 5.5 + Math.random() * 1.8;
      list.push({ user_id: userId, date: dateStr, time_point: 'bedtime', value: Math.round(bed * 10) / 10, record_hour: 22 });
    }
  }
  return list;
}

function writeCollection(type, items) {
  const fileMap = { meals: 'meals.json', exercises: 'exercises.json', bloodSugars: 'blood_sugars.json' };
  const data = {};
  items.forEach(function (it, idx) {
    const id = (type.charAt(0)) + '_' + idx + '_' + Math.random().toString(36).slice(2, 8);
    data[id] = Object.assign({ _id: id, created_at: new Date().toISOString() }, it);
  });
  store._writeRaw(fileMap[type], data);
}

function seed() {
  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });
  const allMeals = [], allExercises = [], allBS = [];
  USERS.forEach(function (u) {
    store.upsertUser(u.id, u);
    allMeals.push.apply(allMeals, generateMeals(u.id, 14, u));
    allExercises.push.apply(allExercises, generateExercises(u.id, 14, u));
    allBS.push.apply(allBS, generateBloodSugars(u.id, 14, u));
  });
  writeCollection('meals', allMeals);
  writeCollection('exercises', allExercises);
  writeCollection('bloodSugars', allBS);
  console.log('已写入用户:', USERS.map(function (u) { return u.id; }).join(', '));
  console.log('饮食记录:', allMeals.length, '条');
  console.log('运动记录:', allExercises.length, '条');
  console.log('血糖记录:', allBS.length, '条');
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
