const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * aiRecommend - 小程序调用入口
 * 入参：{ type: 'diet'|'exercise'|'comprehensive', userId, days }
 * 出参：透传后端 /api/v1/recommend/* 响应
 *
 * 环境变量（在云函数控制台配置）：
 *   BACKEND_URL  - 后端服务地址，如 https://api.example.com
 *   BACKEND_KEY  - 与后端 .env 中 API_KEY 一致
 */
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
const BACKEND_KEY = process.env.BACKEND_KEY || 'dev-secret';

exports.main = async (event) => {
  const type = event.type || 'comprehensive';
  const path = '/api/v1/recommend/' + type;
  const body = { userId: event.userId, days: event.days || 7 };
  try {
    const res = await fetch(BACKEND_URL + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BACKEND_KEY
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { code: -1, message: '后端调用失败: ' + err.message, data: null };
  }
};
