var api = require('../../utils/api');
var recommend = require('../../utils/recommend');
var util = require('../../utils/util');

Page({
  data: {
    loading: true,
    today: '',
    weekNames: ['日', '一', '二', '三', '四', '五', '六'],
    selectedRange: 7, // 7/30 天
    ranges: [
      { id: 7, name: '近 7 天' },
      { id: 30, name: '近 30 天' }
    ],
    targetKcal: 0,
    targetMinutes: 150,
    todayRecord: { mealCount: 0, exerciseMinutes: 0, totalKcal: 0 },
    stats: {
      totalDays: 0,
      dietDays: 0,
      exerciseDays: 0,
      dietAdherence: 0,
      exerciseAdherence: 0,
      avgKcal: 0,
      totalExerciseMinutes: 0,
      streakDays: 0
    },
    // 7 天日历数据
    weeklyView: [],
    recentMeals: [],
    recentExercises: []
  },

  onLoad: function () { this.loadAll(); },
  onShow: function () { this.loadAll(); },

  loadAll: function () {
    var that = this;
    that.setData({ loading: true, today: util.formatDate(new Date()) });
    Promise.all([api.getProfile(), api.getPreferences(), api.getTracking()]).then(function (results) {
      var profile = results[0] || {};
      var preferences = results[1] || { dietary_restrictions: [], exercise_limitations: [] };
      var tracking = results[2] || {};
      var plan = recommend.generateFullPlan(profile, preferences.dietary_restrictions, preferences.exercise_limitations);
      var targetKcal = plan.profile.target || 0;
      that.setData({
        targetKcal: targetKcal,
        targetMinutes: 150
      });
      // 拉取近 7 天数据
      that.loadRange(7, targetKcal, tracking);
    });
  },

  loadRange: function (days, targetKcal, tracking) {
    var that = this;
    var promises = [];
    for (var i = 0; i < days; i++) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var dateStr = util.formatDate(d);
      promises.push(api.getMeals(dateStr).then(function (res) { return res || []; }));
      promises.push(api.getExercises(dateStr).then(function (res) { return res || []; }));
    }
    Promise.all(promises).then(function (all) {
      var weekly = [];
      var totalMeals = 0;
      var totalExercises = 0;
      var totalMinutes = 0;
      var dietAdherentDays = 0;
      var exerciseAdherentDays = 0;
      var totalKcalSum = 0;
      var kcaiDays = 0;
      var recentMeals = [];
      var recentExercises = [];
      for (var i = 0; i < days; i++) {
        var meals = all[i * 2] || [];
        var exercises = all[i * 2 + 1] || [];
        var d = new Date();
        d.setDate(d.getDate() - i);
        var dateStr = util.formatDate(d);
        var day = d.getDay() || 7;
        // 估算当日摄入热量（按主食用量与搭配）
        var dayKcal = 0;
        meals.forEach(function (m) {
          // 简单估算：主食 150g = 200kcal, 配菜 = 100kcal
          var base = 200 + (m.has_vegetable ? 50 : 0) + (m.has_protein ? 100 : 0);
          if (m.has_sweet_food) base += 150;
          if (m.has_sweet_drink) base += 100;
          dayKcal += base;
        });
        totalKcalSum += dayKcal;
        if (dayKcal > 0) kcaiDays++;
        var dayMinutes = 0;
        exercises.forEach(function (e) { dayMinutes += (e.duration_min || e.duration || 0); });
        totalMeals += meals.length;
        totalExercises += exercises.length;
        totalMinutes += dayMinutes;
        // 依从：饮食有记录即算；运动 ≥ 30 分钟
        var dietOk = meals.length >= 2;
        var exOk = dayMinutes >= 30;
        if (dietOk) dietAdherentDays++;
        if (exOk) exerciseAdherentDays++;
        weekly.push({
          date: dateStr,
          day: day,
          dayLabel: ['日','一','二','三','四','五','六'][day-1],
          mealCount: meals.length,
          exerciseCount: exercises.length,
          exerciseMinutes: dayMinutes,
          kcal: dayKcal,
          dietOk: dietOk,
          exOk: exOk
        });
        // 收集最近记录（去重、按时间倒序）
        meals.forEach(function (m) { recentMeals.push(Object.assign({ date: dateStr }, m)); });
        exercises.forEach(function (e) { recentExercises.push(Object.assign({ date: dateStr }, e)); });
      }
      weekly.reverse();
      // 排序最近记录
      recentMeals.sort(function (a, b) { return b.date.localeCompare(a.date); });
      recentExercises.sort(function (a, b) { return b.date.localeCompare(a.date); });
      recentMeals = recentMeals.slice(0, 5);
      recentExercises = recentExercises.slice(0, 5);
      // 连续打卡（最近连续有运动或饮食记录的天数）
      var streak = 0;
      for (var s = 0; s < weekly.length; s++) {
        var w = weekly[s];
        if (w.mealCount > 0 || w.exerciseCount > 0) streak++;
        else if (s > 0) break; // 跳过今天无记录
      }
      // 更新跟踪缓存
      var newTracking = {
        dietAdherence: days > 0 ? Math.round(dietAdherentDays / days * 100) : 0,
        exerciseAdherence: days > 0 ? Math.round(exerciseAdherentDays / days * 100) : 0,
        avgKcal: kcaiDays > 0 ? Math.round(totalKcalSum / kcaiDays) : 0,
        totalExerciseMinutes: totalMinutes,
        streakDays: streak,
        updatedAt: new Date().toISOString()
      };
      api.saveTracking(newTracking);
      // 今日数据
      var today = weekly[weekly.length - 1] || {};
      that.setData({
        loading: false,
        selectedRange: days,
        weeklyView: weekly,
        stats: {
          totalDays: days,
          dietDays: dietAdherentDays,
          exerciseDays: exerciseAdherentDays,
          dietAdherence: newTracking.dietAdherence,
          exerciseAdherence: newTracking.exerciseAdherence,
          avgKcal: newTracking.avgKcal,
          totalExerciseMinutes: totalMinutes,
          avgExerciseMinutes: days > 0 ? Math.round(totalMinutes / days) : 0,
          streakDays: streak
        },
        todayRecord: {
          mealCount: today.mealCount || 0,
          exerciseMinutes: today.exerciseMinutes || 0,
          totalKcal: today.kcal || 0
        },
        recentMeals: recentMeals,
        recentExercises: recentExercises
      });
    }).catch(function () {
      that.setData({ loading: false });
    });
  },

  switchRange: function (e) {
    var days = Number(e.currentTarget.dataset.id);
    if (days === this.data.selectedRange) return;
    this.loadRange(days, this.data.targetKcal, null);
  },

  goRecordMeal: function () { wx.navigateTo({ url: '/pages/meal/meal' }); },
  goRecordExercise: function () { wx.navigateTo({ url: '/pages/exercise/exercise' }); },
  goPlan: function () { wx.navigateTo({ url: '/pages/plan/plan' }); }
});
