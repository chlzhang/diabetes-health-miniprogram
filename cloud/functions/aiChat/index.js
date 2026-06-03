const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * aiChat - AI 对话入口
 * 入参：{ userId, message, history }
 */
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
const BACKEND_KEY = process.env.BACKEND_KEY || 'dev-secret';

exports.main = async (event) => {
  try {
    const res = await fetch(BACKEND_URL + '/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': BACKEND_KEY },
      body: JSON.stringify({
        userId: event.userId,
        message: event.message,
        history: event.history || []
      })
    });
    return await res.json();
  } catch (err) {
    return { code: -1, message: '后端调用失败: ' + err.message, data: null };
  }
};
