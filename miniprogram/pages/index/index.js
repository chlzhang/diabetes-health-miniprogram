var api = require('../../utils/api');
var util = require('../../utils/util');
var constants = require('../../utils/constants');

Page({
  data: {
    today: '',
    loading: true,
    diet: { count: 0, level: '' },
    exercise: { count: 0, minutes: 0, goal: constants.WEEKLY_EXERCISE_GOAL },
    exerciseProgress: 0,
    progressStyle: 'width: 0%;',
    exerciseText: '0%',
    bloodSugar: { count: 0, latest: null, latestStatus: '' },
    family: []
  },
  onShow: function () {
    var today = util.formatDate(new Date());
    this.setData({ today: today });
    this.loadDashboard();
  },
  loadDashboard: function () {
    var that = this;
    that.setData({ loading: true });
    api.getDashboard().then(function (res) {
      res = res || {};
      var ex = res.exercise || { count: 0, minutes: 0, goal: constants.WEEKLY_EXERCISE_GOAL };
      var goal = ex.goal || constants.WEEKLY_EXERCISE_GOAL;
      var pct = goal > 0 ? Math.round(ex.minutes / goal * 100) : 0;
      that.setData({
        loading: false,
        diet: res.diet || { count: 0, level: '' },
        exercise: ex,
        exerciseProgress: Math.min(pct, 100),
        progressStyle: 'width: ' + Math.min(pct, 100) + '%;',
        exerciseText: ex.minutes >= goal ? '✓' : pct + '%',
        bloodSugar: res.bloodSugar || { count: 0, latest: null, latestStatus: '' },
        family: res.family || []
      });
    }).catch(function () {
      that.setData({ loading: false });
    });
  },
  goMeal: function () {
    wx.navigateTo({ url: '/pages/meal/meal' });
  },
  goExercise: function () {
    wx.navigateTo({ url: '/pages/exercise/exercise' });
  },
  goBloodSugar: function () {
    wx.navigateTo({ url: '/pages/bloodsugar/bloodsugar' });
  },
  goPlan: function () {
    wx.navigateTo({ url: '/pages/plan/plan' });
  },
  goTracking: function () {
    wx.navigateTo({ url: '/pages/tracking/tracking' });
  },
  onPullDownRefresh: function () {
    var that = this;
    this.loadDashboard();
    setTimeout(function () { wx.stopPullDownRefresh(); }, 1000);
  }
});
