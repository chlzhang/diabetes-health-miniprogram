var CLOUD_ENV_ID = 'your-env-id';
var isPlaceholderEnv = !CLOUD_ENV_ID || CLOUD_ENV_ID === 'your-env-id' || /^your-/.test(CLOUD_ENV_ID);

App({
  onLaunch: function () {
    if (isPlaceholderEnv) {
      console.warn('[App] 未配置云环境 ID (app.js 中的 CLOUD_ENV_ID)，将以离线模式运行。');
      this.globalData.cloudReady = false;
      return;
    }
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上的基础库以使用云能力');
      this.globalData.cloudReady = false;
      return;
    }
    try {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      });
      this.globalData.db = wx.cloud.database();
      this.globalData.cloudReady = true;
    } catch (e) {
      console.warn('云环境初始化失败', e);
      this.globalData.cloudReady = false;
    }
  },
  globalData: {
    userInfo: null,
    db: null,
    cloudReady: false
  }
});
