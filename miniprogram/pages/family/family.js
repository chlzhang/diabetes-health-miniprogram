var api = require("../../utils/api");

Page({
  data: {
    hasFamily: false,
    familyName: "",
    familyCode: "",
    members: [],
    showJoin: false,
    joinCode: "",
    showCreate: false,
    newName: "",
    loading: true
  },
  onLoad: function() { this.loadFamily(); },
  onShow: function() { if (this.data.hasFamily) this.loadFamily(); },
  loadFamily: function() {
    var that = this;
    that.setData({ loading: true });
    api.getFamilyMembers().then(function(res) {
      if (res && res.family) {
        that.setData({
          hasFamily: true,
          familyName: res.family.name || "",
          familyCode: res.family.code || "",
          members: res.members || [],
          loading: false
        });
      } else {
        that.setData({ hasFamily: false, loading: false });
      }
    }).catch(function() { that.setData({ loading: false }); });
  },
  showJoinInput: function() { this.setData({ showJoin: true, showCreate: false }); },
  showCreateInput: function() { this.setData({ showCreate: true, showJoin: false }); },
  cancelInput: function() { this.setData({ showJoin: false, showCreate: false, joinCode: "", newName: "" }); },
  onJoinCodeInput: function(e) { this.setData({ joinCode: e.detail.value }); },
  onNewNameInput: function(e) { this.setData({ newName: e.detail.value }); },
  joinFamily: function() {
    var that = this;
    if (!that.data.joinCode) { wx.showToast({ title: "请输入家庭码", icon: "none" }); return; }
    api.joinFamily(that.data.joinCode).then(function() {
      wx.showToast({ title: "加入成功", icon: "success" });
      that.setData({ showJoin: false, joinCode: "" });
      that.loadFamily();
    });
  },
  createFamily: function() {
    var that = this;
    if (!that.data.newName) { wx.showToast({ title: "请输入家庭名称", icon: "none" }); return; }
    api.createFamily(that.data.newName).then(function() {
      wx.showToast({ title: "创建成功", icon: "success" });
      that.setData({ showCreate: false, newName: "" });
      that.loadFamily();
    });
  },
  copyCode: function() {
    wx.setClipboardData({ data: this.data.familyCode });
  }
});
