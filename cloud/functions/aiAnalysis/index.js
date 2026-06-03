const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * aiAnalysis - 数据分析入口（不调用 LLM）
 * 入参：{ module: 'diet'|'exercise'|'bloodsugar'|'overview', userId, days }
 */
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
const BACKEND_KEY = process.env.BACKEND_KEY || 'dev-secret';

exports.main = async (event) => {
  const mod = event.module || 'overview';
  const url = BACKEND_URL + '/api/v1/analysis/' + mod + '?userId=' + encodeURIComponent(event.userId) + '&days=' + (event.days || 7);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'X-API-Key': BACKEND_KEY }
    });
    return await res.json();
  } catch (err) {
    return { code: -1, message: '后端调用失败: ' + err.message, data: null };
  }
};
