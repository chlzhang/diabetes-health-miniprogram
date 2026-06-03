/**
 * 菜品 / 运动 / 营养常量（服务端副本）
 *
 * !!! 本文件是从 miniprogram/utils/constants.js 镜像过来的副本，
 *     仅作为后端规则兜底的数据源使用。
 *     任何菜品/运动/营养素的增删改都需要同步更新两侧文件。
 *
 * 服务端副本：server/src/services/recommend/constants.js
 * 小程序原版：miniprogram/utils/constants.js
 */
module.exports = {
  MEAL_TYPES: [
    { id: 'breakfast', name: '早餐', icon: '☀️' },
    { id: 'lunch', name: '午餐', icon: '🌤️' },
    { id: 'dinner', name: '晚餐', icon: '🌙' },
    { id: 'snack', name: '加餐', icon: '🍎' }
  ],
  SPORT_TYPES: [
    { id: 'walking', name: '快走', met: 3.5, intensity: 'moderate' },
    { id: 'jogging', name: '慢跑', met: 7.0, intensity: 'moderate' },
    { id: 'cycling', name: '骑车', met: 6.0, intensity: 'moderate' },
    { id: 'swimming', name: '游泳', met: 6.0, intensity: 'moderate' },
    { id: 'yoga', name: '瑜伽', met: 2.5, intensity: 'light' },
    { id: 'strength', name: '力量训练', met: 5.0, intensity: 'vigorous' },
    { id: 'taiji', name: '太极', met: 2.5, intensity: 'light' },
    { id: 'dance', name: '广场舞', met: 4.0, intensity: 'moderate' }
  ],
  BLOOD_SUGAR_STANDARDS: {
    fasting: { normal: 6.1, low: 3.9, label: '空腹' },
    post_meal: { normal: 7.8, low: 3.9, label: '餐后2h' },
    bedtime: { normal: 7.0, low: 3.9, label: '睡前' }
  },
  WEEKLY_EXERCISE_GOAL: 150,
  GENDERS: [
    { id: 'male', name: '男' },
    { id: 'female', name: '女' }
  ],
  HEALTH_GOALS: [
    { id: 'lose_fat', name: '减脂', desc: '控制热量摄入，增加有氧运动', icon: '🔥' },
    { id: 'maintain', name: '维持', desc: '保持当前体重与健康状态', icon: '⚖️' },
    { id: 'gain_muscle', name: '增肌', desc: '增加蛋白质摄入与力量训练', icon: '💪' }
  ],
  ACTIVITY_LEVELS: [
    { id: 'sedentary', name: '久坐', factor: 1.2, desc: '几乎不运动' },
    { id: 'light', name: '轻度', factor: 1.375, desc: '每周 1-3 次轻运动' },
    { id: 'moderate', name: '中度', factor: 1.55, desc: '每周 3-5 次中等强度运动' },
    { id: 'active', name: '高度', factor: 1.725, desc: '每周 6-7 次高强度运动' }
  ],
  DIETARY_RESTRICTIONS: [
    { id: 'vegetarian', name: '素食', desc: '不吃肉禽鱼' },
    { id: 'no_seafood', name: '忌海鲜', desc: '避免鱼虾蟹贝' },
    { id: 'no_spicy', name: '忌辣', desc: '不吃辛辣刺激' },
    { id: 'no_high_sugar', name: '低糖', desc: '避免高糖食物' },
    { id: 'low_salt', name: '低盐', desc: '控制钠摄入' },
    { id: 'no_gluten', name: '无麸质', desc: '避免面筋类食物' }
  ],
  EXERCISE_LIMITATIONS: [
    { id: 'knee_problem', name: '膝关节不适', desc: '避免跑跳等高冲击运动' },
    { id: 'back_problem', name: '腰部不适', desc: '避免负重深蹲等动作' },
    { id: 'heart_condition', name: '心血管问题', desc: '仅限轻度运动' },
    { id: 'beginner', name: '运动新手', desc: '从低强度开始' },
    { id: 'no_outdoor', name: '不便外出', desc: '仅限居家运动' }
  ],
  MEAL_CALORIE_RATIO: {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.30,
    snack: 0.10
  },
  MACRO_SPLIT: {
    lose_fat: { protein: 0.30, carb: 0.40, fat: 0.30 },
    maintain: { protein: 0.25, carb: 0.50, fat: 0.25 },
    gain_muscle: { protein: 0.30, carb: 0.50, fat: 0.20 }
  },
  DISH_DATABASE: {
    staple: [
      { id: 'mixed_grain_rice', name: '杂粮饭', unit: '1 碗 (150g)', kcal: 180, protein: 5, carb: 38, fat: 1, tags: ['low_gi'], icon: '🍚' },
      { id: 'oat_porridge', name: '燕麦粥', unit: '1 碗 (200g)', kcal: 150, protein: 6, carb: 27, fat: 3, tags: ['low_gi', 'vegetarian'], icon: '🥣' },
      { id: 'corn', name: '蒸玉米', unit: '1 根 (200g)', kcal: 172, protein: 6, carb: 38, fat: 2, tags: ['low_gi', 'vegetarian'], icon: '🌽' },
      { id: 'sweet_potato', name: '蒸红薯', unit: '1 个 (150g)', kcal: 130, protein: 2, carb: 30, fat: 0, tags: ['low_gi', 'vegetarian'], icon: '🍠' },
      { id: 'whole_wheat_bread', name: '全麦面包', unit: '2 片 (60g)', kcal: 156, protein: 5, carb: 30, fat: 1, tags: ['low_gi', 'vegetarian'], icon: '🍞' },
      { id: 'buckwheat_noodle', name: '荞麦面', unit: '1 份 (100g)', kcal: 145, protein: 5, carb: 30, fat: 1, tags: ['low_gi', 'vegetarian'], icon: '🍜' },
      { id: 'brown_rice', name: '糙米饭', unit: '1 碗 (150g)', kcal: 165, protein: 4, carb: 36, fat: 1, tags: ['low_gi', 'vegetarian'], icon: '🍚' },
      { id: 'multigrain_bun', name: '杂粮馒头', unit: '1 个 (100g)', kcal: 145, protein: 5, carb: 30, fat: 1, tags: ['low_gi', 'vegetarian'], icon: '🍞' }
    ],
    protein: [
      { id: 'chicken_breast', name: '清蒸鸡胸', unit: '100g', kcal: 165, protein: 31, carb: 0, fat: 4, tags: ['high_protein'], icon: '🍗' },
      { id: 'steamed_fish', name: '清蒸鱼', unit: '100g', kcal: 130, protein: 24, carb: 0, fat: 4, tags: ['high_protein', 'seafood'], icon: '🐟' },
      { id: 'tofu', name: '嫩豆腐', unit: '150g', kcal: 120, protein: 12, carb: 6, fat: 7, tags: ['high_protein', 'vegetarian'], icon: '🥘' },
      { id: 'egg', name: '水煮蛋', unit: '2 个', kcal: 156, protein: 12, carb: 1, fat: 11, tags: ['high_protein', 'vegetarian'], icon: '🥚' },
      { id: 'shrimp', name: '白灼虾', unit: '100g', kcal: 100, protein: 20, carb: 0, fat: 1, tags: ['high_protein', 'seafood'], icon: '🦐' },
      { id: 'lean_beef', name: '瘦牛肉', unit: '100g', kcal: 200, protein: 26, carb: 0, fat: 10, tags: ['high_protein'], icon: '🥩' },
      { id: 'pork_loin', name: '猪里脊', unit: '100g', kcal: 150, protein: 25, carb: 0, fat: 5, tags: ['high_protein'], icon: '🥓' },
      { id: 'tempeh', name: '卤豆干', unit: '100g', kcal: 140, protein: 14, carb: 5, fat: 8, tags: ['high_protein', 'vegetarian'], icon: '🧆' },
      { id: 'yogurt', name: '无糖酸奶', unit: '1 杯 (150g)', kcal: 90, protein: 6, carb: 8, fat: 4, tags: ['vegetarian'], icon: '🥛' },
      { id: 'milk', name: '低脂牛奶', unit: '1 杯 (250ml)', kcal: 110, protein: 9, carb: 12, fat: 3, tags: ['vegetarian'], icon: '🥛' }
    ],
    vegetable: [
      { id: 'broccoli', name: '清炒西兰花', unit: '150g', kcal: 50, protein: 4, carb: 8, fat: 0, tags: ['vegetarian'], icon: '🥦' },
      { id: 'spinach', name: '蒜蓉菠菜', unit: '150g', kcal: 35, protein: 4, carb: 5, fat: 0, tags: ['vegetarian'], icon: '🥬' },
      { id: 'tomato', name: '凉拌番茄', unit: '150g', kcal: 30, protein: 1, carb: 6, fat: 0, tags: ['vegetarian'], icon: '🍅' },
      { id: 'cucumber', name: '拍黄瓜', unit: '150g', kcal: 25, protein: 1, carb: 5, fat: 0, tags: ['vegetarian'], icon: '🥒' },
      { id: 'winter_melon', name: '冬瓜汤', unit: '200g', kcal: 20, protein: 1, carb: 4, fat: 0, tags: ['vegetarian'], icon: '🍲' },
      { id: 'bitter_melon', name: '凉拌苦瓜', unit: '150g', kcal: 30, protein: 1, carb: 6, fat: 0, tags: ['vegetarian'], icon: '🥒' },
      { id: 'celery', name: '芹菜百合', unit: '150g', kcal: 25, protein: 2, carb: 5, fat: 0, tags: ['vegetarian'], icon: '🥬' },
      { id: 'mushroom', name: '香菇青菜', unit: '150g', kcal: 35, protein: 5, carb: 5, fat: 0, tags: ['vegetarian'], icon: '🍄' },
      { id: 'lettuce', name: '生菜沙拉', unit: '150g', kcal: 20, protein: 1, carb: 4, fat: 0, tags: ['vegetarian'], icon: '🥗' },
      { id: 'eggplant', name: '蒜泥茄子', unit: '150g', kcal: 40, protein: 2, carb: 8, fat: 0, tags: ['vegetarian'], icon: '🍆' },
      { id: 'kelp', name: '凉拌海带', unit: '100g', kcal: 25, protein: 1, carb: 5, fat: 0, tags: ['vegetarian', 'seafood'], icon: '🌿' }
    ]
  },
  EXERCISE_DATABASE: [
    { id: 'walking', name: '快走', type: 'cardio', intensity: 'moderate', met: 3.5, impact: 'medium', duration: 40, tags: ['indoor', 'outdoor'], icon: '🚶' },
    { id: 'jogging', name: '慢跑', type: 'cardio', intensity: 'moderate', met: 7.0, impact: 'high', duration: 30, tags: ['outdoor'], icon: '🏃' },
    { id: 'swimming', name: '游泳', type: 'cardio', intensity: 'moderate', met: 6.0, impact: 'low', duration: 30, tags: ['indoor', 'outdoor'], icon: '🏊' },
    { id: 'cycling', name: '骑车', type: 'cardio', intensity: 'moderate', met: 6.0, impact: 'low', duration: 40, tags: ['indoor', 'outdoor'], icon: '🚴' },
    { id: 'elliptical', name: '椭圆机', type: 'cardio', intensity: 'moderate', met: 5.0, impact: 'low', duration: 30, tags: ['indoor'], icon: '🏋️' },
    { id: 'rope_skipping', name: '跳绳', type: 'cardio', intensity: 'vigorous', met: 10.0, impact: 'high', duration: 15, tags: ['indoor', 'outdoor'], icon: '🤸' },
    { id: 'aerobics', name: '健身操', type: 'cardio', intensity: 'moderate', met: 5.0, impact: 'medium', duration: 30, tags: ['indoor'], icon: '💃' },
    { id: 'dance', name: '广场舞', type: 'cardio', intensity: 'moderate', met: 4.0, impact: 'low', duration: 40, tags: ['indoor', 'outdoor'], icon: '💃' },
    { id: 'dumbbell', name: '哑铃训练', type: 'strength', intensity: 'vigorous', met: 5.0, impact: 'low', duration: 30, tags: ['indoor'], icon: '🏋️' },
    { id: 'resistance_band', name: '弹力带', type: 'strength', intensity: 'light', met: 3.0, impact: 'low', duration: 20, tags: ['indoor'], icon: '🤸' },
    { id: 'bodyweight', name: '徒手训练', type: 'strength', intensity: 'moderate', met: 4.0, impact: 'medium', duration: 25, tags: ['indoor'], icon: '🤸' },
    { id: 'machine', name: '器械训练', type: 'strength', intensity: 'vigorous', met: 5.0, impact: 'low', duration: 40, tags: ['indoor'], icon: '🏋️' },
    { id: 'yoga', name: '瑜伽', type: 'flexibility', intensity: 'light', met: 2.5, impact: 'low', duration: 30, tags: ['indoor'], icon: '🧘' },
    { id: 'taiji', name: '太极', type: 'flexibility', intensity: 'light', met: 2.5, impact: 'low', duration: 30, tags: ['indoor', 'outdoor'], icon: '🧘' },
    { id: 'pilates', name: '普拉提', type: 'flexibility', intensity: 'light', met: 3.0, impact: 'low', duration: 30, tags: ['indoor'], icon: '🧘' },
    { id: 'stretching', name: '拉伸放松', type: 'flexibility', intensity: 'light', met: 2.0, impact: 'low', duration: 15, tags: ['indoor', 'outdoor'], icon: '🧘' }
  ]
};
