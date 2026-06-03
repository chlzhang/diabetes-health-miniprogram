var api = require('../../utils/api');
var util = require('../../utils/util');

var QUICK_PROMPTS = [
  '我最近餐后数值偏高，饮食该怎么调整？',
  '我每天走 30 分钟，够不够？',
  '有什么适合在家做的运动？',
  '我能吃水果吗？推荐几种低 GI 的。',
  '最近数值偏高，饮食上要注意什么？',
  '加班熬夜时晚餐怎么吃？'
];

Page({
  data: {
    messages: [],
    inputText: '',
    sending: false,
    scrollTop: 0,
    quickPrompts: QUICK_PROMPTS,
    context: null
  },

  onLoad: function () {
    var welcome = {
      role: 'assistant',
      content: '你好！我是你的健康生活助手 🌿\n\n我可以基于你的身体数据与近 7 天记录，给出饮食、运动方面的参考建议。\n所有内容仅供参考，不构成医疗建议。\n试试点击下方快捷问题，或直接输入你的疑问。',
      time: util.formatTime(new Date())
    };
    this.setData({ messages: [welcome] });
  },

  onShow: function () { this.scrollToBottom(); },

  onInput: function (e) { this.setData({ inputText: e.detail.value }); },

  scrollToBottom: function () {
    this.setData({ scrollTop: 99999 });
  },

  sendMessage: function (text) {
    var that = this;
    text = (text || that.data.inputText).trim();
    if (!text || that.data.sending) return;
    var userMsg = { role: 'user', content: text, time: util.formatTime(new Date()) };
    var messages = that.data.messages.concat([userMsg]);
    that.setData({ messages: messages, inputText: '', sending: true });
    that.scrollToBottom();
    var history = messages.slice(0, -1).slice(-8).map(function (m) { return { role: m.role, content: m.content }; });
    var userId = (getApp() && getApp().globalData && getApp().globalData.openid) || 'demo_user_001';
    api.chatWithAI(userId, text, history).then(function (res) {
      var reply = (res && res.data && res.data.reply) || null;
      var content = '';
      var suggestions = [];
      var followup = '';
      if (reply) {
        content = reply.reply || '';
        suggestions = reply.suggestions || [];
        followup = reply.followup || '';
      } else {
        content = '抱歉，未能获取到回答，请稍后重试。';
      }
      var fullContent = content;
      if (suggestions && suggestions.length) {
        fullContent += '\n\n建议：\n' + suggestions.map(function (s) { return '· ' + s; }).join('\n');
      }
      if (followup) {
        fullContent += '\n\n👉 ' + followup;
      }
      var aiMsg = {
        role: 'assistant',
        content: fullContent,
        contentRaw: content,
        suggestions: suggestions,
        followup: followup,
        source: (res && res.data && res.data.source) || 'fallback',
        time: util.formatTime(new Date())
      };
      that.setData({ messages: that.data.messages.concat([aiMsg]), sending: false, context: (res && res.data && res.data.analysis) || null });
      that.scrollToBottom();
    }).catch(function () {
      that.setData({ sending: false });
      that.setData({ messages: that.data.messages.concat([{ role: 'assistant', content: '网络异常，请稍后再试。', time: util.formatTime(new Date()) }]) });
      that.scrollToBottom();
    });
  },

  onSendTap: function () { this.sendMessage(); },

  onQuickTap: function (e) { this.sendMessage(e.currentTarget.dataset.text); },

  clearHistory: function () {
    var that = this;
    wx.showModal({
      title: '清空对话',
      content: '将清空当前对话记录（不影响历史数据）',
      success: function (res) {
        if (res.confirm) {
          var welcome = {
            role: 'assistant',
            content: '对话已清空。我还在这里，问我吧～',
            time: util.formatTime(new Date())
          };
          that.setData({ messages: [welcome] });
        }
      }
    });
  }
});
