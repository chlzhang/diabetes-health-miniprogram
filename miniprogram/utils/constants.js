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
  WEEKLY_EXERCISE_GOAL: 150
};
