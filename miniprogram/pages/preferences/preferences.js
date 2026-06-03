var api = require('../../utils/api');
var constants = require('../../utils/constants');

Page({
  data: {
    dietaryRestrictions: constants.DIETARY_RESTRICTIONS,
    exerciseLimitations: constants.EXERCISE_LIMITATIONS,
    selectedDietary: [],
    selectedExercise: [],
    saving: false
  },

  onLoad: function () { this.loadPreferences(); },
  onShow: function () { this.loadPreferences(); },

  loadPreferences: function () {
    var that = this;
    api.getPreferences().then(function (prefs) {
      prefs = prefs || {};
      that.setData({
        selectedDietary: prefs.dietary_restrictions || [],
        selectedExercise: prefs.exercise_limitations || []
      });
    });
  },

  toggleDietary: function (e) {
    var id = e.currentTarget.dataset.id;
    var list = this.data.selectedDietary.slice();
    var idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1); else list.push(id);
    this.setData({ selectedDietary: list });
  },

  toggleExercise: function (e) {
    var id = e.currentTarget.dataset.id;
    var list = this.data.selectedExercise.slice();
    var idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1); else list.push(id);
    this.setData({ selectedExercise: list });
  },

  savePreferences: function () {
    var that = this;
    var prefs = {
      dietary_restrictions: that.data.selectedDietary,
      exercise_limitations: that.data.selectedExercise
    };
    that.setData({ saving: true });
    api.savePreferences(prefs).then(function () {
      that.setData({ saving: false });
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(function () { wx.navigateBack(); }, 600);
    }).catch(function () {
      that.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  },

  isDietarySelected: function (id) {
    return this.data.selectedDietary.indexOf(id) >= 0;
  },
  isExerciseSelected: function (id) {
    return this.data.selectedExercise.indexOf(id) >= 0;
  }
});
