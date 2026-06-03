var api = require("../../utils/api");
var util = require("../../utils/util");

Page({
  data: {
    userInfo: null,
    hasFamily: false,
    familyCode: "",
    familyName: "",
    memberCount: 0,
    stats: {
      totalMeals: 0,
      totalExercises: 0,
      totalBSChecks: 0,
      streakDays: 0
    },
    loading: true
  },
  onLoad: function() { this.loadProfile(); },
  onShow: function() { this.loadProfile(); },
  loadProfile: function() {
    var that = this;
    that.setData({ loading: true });
    api.login().then(function(res) {
      if (res && res.userInfo) {
        that.setData({ userInfo: res.userInfo });
      }
    }).catch(function() {});
    api.getFamilyMembers().then(function(res) {
      if (res && res.family) {
        that.setData({
          hasFamily: true,
          familyCode: res.family.code || "",
          familyName: res.family.name || "",
          memberCount: (res.members || []).length
        });
      } else {
        that.setData({ hasFamily: false });
      }
    }).catch(function() {});
    api.getDashboard().then(function(res) {
      that.setData({
        loading: false,
        stats: {
          totalMeals: (res.diet && res.diet.count) || 0,
          totalExercises: (res.exercise && res.exercise.count) || 0,
          totalBSChecks: (res.bloodSugar && res.bloodSugar.count) || 0,
          streakDays: res.streakDays || 0
        }
      });
    }).catch(function() { that.setData({ loading: false }); });
  },
  copyCode: function() {
    wx.setClipboardData({ data: this.data.familyCode });
  },
  goFamily: function() {
    wx.switchTab({ url: "/pages/family/family" });
  },
  goProfile: function() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },
  goPlan: function() {
    wx.navigateTo({ url: "/pages/plan/plan" });
  },
  goTracking: function() {
    wx.navigateTo({ url: "/pages/tracking/tracking" });
  },
  goPreferences: function() {
    wx.navigateTo({ url: "/pages/preferences/preferences" });
  },
  goAIChat: function() {
    wx.navigateTo({ url: "/pages/aichat/aichat" });
  },
  clearCache: function() {
    wx.showModal({
      title: "提示",
      content: "确定要清除缓存吗？",
      success: function(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: "缓存已清除", icon: "success" });
        }
      }
    });
  }
});
