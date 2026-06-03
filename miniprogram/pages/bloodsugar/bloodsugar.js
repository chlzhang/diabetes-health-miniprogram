var api = require("../../utils/api");
var util = require("../../utils/util");
var constants = require("../../utils/constants");

Page({
  data: {
    timePoints: [
      { id: "fasting", label: "空腹", icon: "🌅" },
      { id: "post_meal", label: "餐后2h", icon: "🍚" },
      { id: "bedtime", label: "睡前", icon: "🌙" }
    ],
    activeTimePoint: "fasting",
    bloodSugarValue: "",
    submitting: false,
    todayRecords: [],
    statusResult: null
  },
  onLoad: function() { this.loadTodayRecords(); },
  switchTimePoint: function(e) {
    this.setData({ activeTimePoint: e.currentTarget.dataset.id, statusResult: null });
  },
  onValueInput: function(e) { this.setData({ bloodSugarValue: e.detail.value }); },
  checkStatus: function() {
    var val = parseFloat(this.data.bloodSugarValue);
    if (isNaN(val) || val <= 0) return;
    var status = util.getBloodSugarStatus(val, this.data.activeTimePoint);
    var std = constants.BLOOD_SUGAR_STANDARDS[this.data.activeTimePoint];
    var suggestion = "";
    if (status === "normal") suggestion = "数值正常，请继续保持";
    else if (status === "high") suggestion = "数值偏高，建议关注饮食并适量运动";
    else suggestion = "数值偏低，请及时补充能量";
    this.setData({
      statusResult: {
        value: val,
        status: status,
        standard: std,
        suggestion: suggestion
      }
    });
  },
  submitBloodSugar: function() {
    var that = this;
    if (!that.data.bloodSugarValue) { wx.showToast({ title: "请填写血糖值", icon: "none" }); return; }
    var val = parseFloat(that.data.bloodSugarValue);
    if (isNaN(val) || val <= 0) { wx.showToast({ title: "请输入有效数值", icon: "none" }); return; }
    that.setData({ submitting: true });
    api.addBloodSugar({
      timePoint: that.data.activeTimePoint,
      value: val
    }).then(function() {
      wx.showToast({ title: "记录成功", icon: "success" });
      that.setData({ bloodSugarValue: "", submitting: false, statusResult: null });
      that.loadTodayRecords();
    }).catch(function() { that.setData({ submitting: false }); });
  },
  loadTodayRecords: function() {
    var that = this;
    api.getBloodSugars(util.formatDate(new Date())).then(function(res) { that.setData({ todayRecords: res || [] }); });
  }
});
