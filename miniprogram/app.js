App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上的基础库以使用云能力');
      return;
    }
    try {
      wx.cloud.init({
        env: 'your-env-id',
        traceUser: true
      });
      this.globalData.db = wx.cloud.database();
      this.globalData.cloudReady = true;
    } catch (e) {
      console.warn('云环境初始化失败，请在 app.js 中配置真实 env ID');
      this.globalData.cloudReady = false;
    }
  },
  globalData: {
    userInfo: null,
    db: null,
    cloudReady: false
  }
});
