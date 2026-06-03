var api = require("../../utils/api");
var util = require("../../utils/util");
var constants = require("../../utils/constants");

Page({
  data: {
    sportTypes: constants.SPORT_TYPES,
    activeSport: "walking",
    duration: "",
    todayExercises: [],
    submitting: false
  },
  onLoad: function() { this.loadTodayExercises(); },
  switchSport: function(e) { this.setData({activeSport: e.currentTarget.dataset.id}); },
  onDurationInput: function(e) { this.setData({duration: e.detail.value}); },
  submitExercise: function() {
    var that = this;
    if (!that.data.duration) { wx.showToast({title:"请填写运动时长",icon:"none"}); return; }
    var sport = constants.SPORT_TYPES.find(function(s){ return s.id === that.data.activeSport; });
    var dur = parseInt(that.data.duration);
    var weight = 65;
    var calories = util.calcCalories(sport.met, weight, dur);
    that.setData({submitting: true});
    api.addExercise({
      sportType: that.data.activeSport,
      duration: dur,
      calories: calories
    }).then(function() {
      wx.showToast({title:"记录成功",icon:"success"});
      that.setData({duration:"",submitting:false});
      that.loadTodayExercises();
    }).catch(function() { that.setData({submitting:false}); });
  },
  loadTodayExercises: function() {
    var that = this;
    api.getExercises(util.formatDate(new Date())).then(function(res) { that.setData({todayExercises: res || []}); });
  }
});