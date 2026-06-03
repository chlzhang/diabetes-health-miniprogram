var api = require('../../utils/api');
var recommend = require('../../utils/recommend');
var constants = require('../../utils/constants');

Page({
  data: {
    genders: constants.GENDERS,
    goals: constants.HEALTH_GOALS,
    activityLevels: constants.ACTIVITY_LEVELS,
    profile: {
      height_cm: '',
      weight_kg: '',
      age: '',
      gender: 'male',
      activity_level: 'light',
      health_goal: 'maintain'
    },
    bmi: null,
    bmiLabel: '',
    bmiCategory: '',
    bmiColor: '',
    tdee: 0,
    target: 0,
    macros: { protein_g: 0, carb_g: 0, fat_g: 0 },
    saving: false
  },

  onLoad: function () { this.loadProfile(); },
  onShow: function () { this.loadProfile(); },

  loadProfile: function () {
    var that = this;
    api.getProfile().then(function (profile) {
      profile = profile || {};
      var p = {
        height_cm: profile.height_cm || '',
        weight_kg: profile.weight_kg || '',
        age: profile.age || '',
        gender: profile.gender || 'male',
        activity_level: profile.activity_level || 'light',
        health_goal: profile.health_goal || 'maintain'
      };
      that.setData({ profile: p });
      that.recompute(p);
    });
  },

  recompute: function (p) {
    var num = {
      height_cm: Number(p.height_cm) || 0,
      weight_kg: Number(p.weight_kg) || 0,
      age: Number(p.age) || 0,
      gender: p.gender,
      activity_level: p.activity_level,
      health_goal: p.health_goal
    };
    var bmi = recommend.calcBMI(num);
    var tdee = recommend.calcTDEE(num);
    var calorie = recommend.calcCalorieTarget(num);
    var macros = recommend.calcMacros(num);
    var bmiLabel = '';
    var bmiCategory = '';
    var bmiColor = '#16a34a';
    if (bmi) {
      if (bmi.category === 'underweight') { bmiLabel = '偏瘦'; bmiColor = '#0ea5e9'; }
      else if (bmi.category === 'overweight') { bmiLabel = '超重'; bmiColor = '#ea580c'; }
      else if (bmi.category === 'obese') { bmiLabel = '肥胖'; bmiColor = '#dc2626'; }
      else { bmiLabel = '正常'; bmiColor = '#16a34a'; }
      bmiCategory = bmi.category;
    }
    this.setData({
      bmi: bmi ? bmi.value : null,
      bmiLabel: bmiLabel,
      bmiCategory: bmiCategory,
      bmiColor: bmiColor,
      tdee: tdee,
      target: calorie.target,
      macros: macros
    });
  },

  onHeightInput: function (e) {
    var p = this.data.profile;
    p.height_cm = e.detail.value;
    this.setData({ profile: p });
    this.recompute(p);
  },
  onWeightInput: function (e) {
    var p = this.data.profile;
    p.weight_kg = e.detail.value;
    this.setData({ profile: p });
    this.recompute(p);
  },
  onAgeInput: function (e) {
    var p = this.data.profile;
    p.age = e.detail.value;
    this.setData({ profile: p });
    this.recompute(p);
  },
  pickGender: function (e) {
    var p = this.data.profile;
    p.gender = e.currentTarget.dataset.id;
    this.setData({ profile: p });
    this.recompute(p);
  },
  pickActivity: function (e) {
    var p = this.data.profile;
    p.activity_level = e.currentTarget.dataset.id;
    this.setData({ profile: p });
    this.recompute(p);
  },
  pickGoal: function (e) {
    var p = this.data.profile;
    p.health_goal = e.currentTarget.dataset.id;
    this.setData({ profile: p });
    this.recompute(p);
  },

  saveProfile: function () {
    var that = this;
    var p = this.data.profile;
    if (!p.height_cm || !p.weight_kg || !p.age) {
      wx.showToast({ title: '请填写完整身体数据', icon: 'none' });
      return;
    }
    var num = {
      height_cm: Number(p.height_cm),
      weight_kg: Number(p.weight_kg),
      age: Number(p.age),
      gender: p.gender,
      activity_level: p.activity_level,
      health_goal: p.health_goal
    };
    that.setData({ saving: true });
    api.saveProfile(num).then(function () {
      that.setData({ saving: false });
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(function () {
        wx.switchTab({ url: '/pages/index/index' });
      }, 600);
    }).catch(function () {
      that.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  }
});
