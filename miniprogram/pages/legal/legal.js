// ============================================
//  法律文档展示页
//  使用 web-view 加载 docs/legal/ 下的 HTML
//  部署前请把 LEGAL_BASE 改为你的实际域名（需 ICP 备案 + HTTPS）
// ============================================

// TODO: 部署前替换为你的实际域名
var LEGAL_BASE = 'https://YOUR_DOMAIN/legal';

var LEGAL_URLS = {
  'user-agreement':    LEGAL_BASE + '/user-agreement.html',
  'privacy-policy':    LEGAL_BASE + '/privacy-policy.html',
  'health-disclaimer': LEGAL_BASE + '/health-disclaimer.html'
};

var LEGAL_TITLES = {
  'user-agreement':    '用户协议',
  'privacy-policy':    '隐私政策',
  'health-disclaimer': '健康免责声明'
};

Page({
  data: { url: '' },

  onLoad: function (options) {
    var type = (options && options.type) || 'user-agreement';
    var url = LEGAL_URLS[type] || LEGAL_URLS['user-agreement'];
    var title = LEGAL_TITLES[type] || '法律文档';
    wx.setNavigationBarTitle({ title: title });
    this.setData({ url: url, type: type });
  },

  // web-view 加载失败提示
  onError: function () {
    wx.showModal({
      title: '加载失败',
      content: '法律文档暂时无法访问，请检查网络或稍后重试。',
      showCancel: false
    });
  },

  // 分享
  onShareAppMessage: function () {
    return {
      title: '健康生活助手 - ' + (LEGAL_TITLES[this.data.type] || '法律文档'),
      path: '/pages/legal/legal?type=' + (this.data.type || 'user-agreement')
    };
  }
});
