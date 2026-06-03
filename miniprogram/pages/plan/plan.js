var api = require('../../utils/api');
var recommend = require('../../utils/recommend');
var util = require('../../utils/util');

Page({
  data: {
    loading: true,
    hasProfile: false,
    today: '',
    activeTab: 'diet',
    tabs: [
      { id: 'diet', name: '饮食方案', icon: '🥗' },
      { id: 'exercise', name: '运动方案', icon: '🏃' }
    ],
    profile: null,
    preferences: null,
    bmi: null,
    bmiLabel: '',
    bmiColor: '#16a34a',
    targetKcal: 0,
    tdee: 0,
    macros: { protein_g: 0, carb_g: 0, fat_g: 0 },
    goalName: '维持',
    diet: null,
    exercise: null,
    todayExercise: null,
    weekNames: ['日', '一', '二', '三', '四', '五', '六'],
    selectedDay: 0,
    weeklyPlan: [],
    todayRecord: { mealCount: 0, exerciseMinutes: 0 }
  },

  onLoad: function () { this.loadAll(); },
  onShow: function () { this.loadAll(); },

  loadAll: function () {
    var that = this;
    that.setData({ loading: true, today: util.formatDate(new Date()) });
    Promise.all([api.getProfile(), api.getPreferences()]).then(function (results) {
      var profile = results[0] || {};
      var preferences = results[1] || { dietary_restrictions: [], exercise_limitations: [] };
      var hasProfile = !!(profile.height_cm && profile.weight_kg && profile.age);
      that.setData({ preferences: preferences });
      if (!hasProfile) {
        that.setData({ loading: false, hasProfile: false, profile: profile });
        return;
      }
      var plan = recommend.generateFullPlan(profile, preferences.dietary_restrictions, preferences.exercise_limitations);
      var bmi = plan.profile.bmi;
      var bmiLabel = '', bmiColor = '#16a34a';
      if (bmi) {
        if (bmi.category === 'underweight') { bmiLabel = '偏瘦'; bmiColor = '#0ea5e9'; }
        else if (bmi.category === 'overweight') { bmiLabel = '超重'; bmiColor = '#ea580c'; }
        else if (bmi.category === 'obese') { bmiLabel = '肥胖'; bmiColor = '#dc2626'; }
        else { bmiLabel = '正常'; bmiColor = '#16a34a'; }
      }
      var goalName = '维持';
      if (plan.profile.goal === 'lose_fat') goalName = '减脂';
      else if (plan.profile.goal === 'gain_muscle') goalName = '增肌';
      var todayExercise = recommend.getTodayExercise(plan.exercise);
      var weekNames = ['日', '一', '二', '三', '四', '五', '六'];
      var today = new Date();
      var todayDay = today.getDay() || 7;
      that.setData({
        loading: false,
        hasProfile: true,
        profile: profile,
        bmi: bmi ? bmi.value : null,
        bmiLabel: bmiLabel,
        bmiColor: bmiColor,
        targetKcal: plan.profile.target,
        tdee: plan.profile.tdee,
        macros: plan.macros,
        goalName: goalName,
        diet: plan.diet,
        exercise: plan.exercise,
        todayExercise: todayExercise,
        weekNames: weekNames,
        selectedDay: todayDay,
        weeklyPlan: plan.exercise ? plan.exercise.weeklyPlan : []
      });
      that.loadTodayRecord();
    }).catch(function () {
      that.setData({ loading: false });
    });
  },

  loadTodayRecord: function () {
    var that = this;
    var today = util.formatDate(new Date());
    Promise.all([api.getMeals(today), api.getExercises(today)]).then(function (res) {
      var meals = res[0] || [];
      var exercises = res[1] || [];
      var mealCount = meals.length;
      var exerciseMinutes = 0;
      exercises.forEach(function (e) { exerciseMinutes += (e.duration_min || e.duration || 0); });
      that.setData({ todayRecord: { mealCount: mealCount, exerciseMinutes: exerciseMinutes } });
    });
  },

  switchTab: function (e) { this.setData({ activeTab: e.currentTarget.dataset.id }); },

  pickDay: function (e) { this.setData({ selectedDay: Number(e.currentTarget.dataset.day) }); },

  regenerate: function () {
    var that = this;
    wx.showModal({
      title: '重新生成方案',
      content: '将根据当前身体数据与偏好，重新生成今日饮食与运动方案',
      success: function (res) {
        if (res.confirm) that.loadAll();
      }
    });
  },

  goRecordMeal: function () { wx.navigateTo({ url: '/pages/meal/meal' }); },
  goRecordExercise: function () { wx.navigateTo({ url: '/pages/exercise/exercise' }); },
  goProfile: function () { wx.navigateTo({ url: '/pages/profile/profile' }); },
  goPreferences: function () { wx.navigateTo({ url: '/pages/preferences/preferences' }); }
});
