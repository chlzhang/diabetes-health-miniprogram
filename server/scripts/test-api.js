'use strict';
/**
 * 接口自测脚本（无需 LLM key，依赖 mock provider 即可运行）
 *   node scripts/test-api.js
 */
const http = require('http');
const { seed } = require('./seed');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'dev-secret';

function request(method, path, body) {
  return new Promise(function (resolve, reject) {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: HOST, port: PORT, method: method, path: path,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, function (res) {
      let chunks = '';
      res.on('data', function (c) { chunks += c; });
      res.on('end', function () {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch (e) { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function fmt(o) { return JSON.stringify(o, null, 2).split('\n').slice(0, 30).join('\n') + (JSON.stringify(o).length > 800 ? '\n... (truncated)' : ''); }

async function main() {
  console.log('1) 写入种子数据...');
  seed();

  console.log('\n2) 健康检查:');
  let r = await request('GET', '/health');
  console.log('  status=' + r.status, r.body);

  console.log('\n3) API 索引:');
  r = await request('GET', '/api/v1/');
  console.log('  status=' + r.status, Object.keys(r.body.endpoints));

  console.log('\n4) 综合分析:');
  r = await request('GET', '/api/v1/analysis/overview?userId=demo_user_001&days=7');
  console.log('  status=' + r.status);
  console.log('  overallScore:', r.body.data && r.body.data.overallScore);
  console.log('  riskLevel:', r.body.data && r.body.data.riskLevel);
  console.log('  insights:', r.body.data && r.body.data.insights);

  console.log('\n5) 饮食分析:');
  r = await request('GET', '/api/v1/analysis/diet?userId=demo_user_001&days=7');
  console.log('  adherence=' + (r.body.data && r.body.data.adherence) + '%');
  console.log('  avgKcal=' + (r.body.data && r.body.data.kcal && r.body.data.kcal.avg));
  console.log('  issues=' + (r.body.data && r.body.data.issues));

  console.log('\n6) 运动分析:');
  r = await request('GET', '/api/v1/analysis/exercise?userId=demo_user_001&days=7');
  console.log('  totalMinutes=' + (r.body.data && r.body.data.totalMinutes));
  console.log('  goalPercent=' + (r.body.data && r.body.data.goalPercent) + '%');

  console.log('\n7) 血糖分析:');
  r = await request('GET', '/api/v1/analysis/bloodsugar?userId=demo_user_001&days=7');
  console.log('  tirPercent=' + (r.body.data && r.body.data.tirPercent) + '%');
  console.log('  byType=' + JSON.stringify(r.body.data && r.body.data.typeStats && Object.keys(r.body.data.typeStats).map(function (k) { return k + ':' + (r.body.data.typeStats[k].avg || 0); })));

  console.log('\n8) LLM 上下文 (调试):');
  r = await request('GET', '/api/v1/recommend/context/demo_user_001?days=7');
  console.log('  profile.target_kcal=' + (r.body.data && r.body.data.profile && r.body.data.profile.target_kcal));
  console.log('  rawCounts=' + JSON.stringify(r.body.data && r.body.data.rawCounts));

  console.log('\n9) 饮食推荐 (mock LLM):');
  r = await request('POST', '/api/v1/recommend/diet', { userId: 'demo_user_001', days: 7 });
  console.log('  source=' + (r.body.data && r.body.data.source));
  if (r.body.data && r.body.data.plan) {
    console.log('  summary=' + (r.body.data.plan.summary || '').slice(0, 60));
    console.log('  meals=' + (r.body.data.plan.meals || []).map(function (m) { return m.type + ':' + m.kcal; }).join(', '));
  } else {
    console.log('  result=' + fmt(r.body).slice(0, 400));
  }

  console.log('\n10) 运动推荐:');
  r = await request('POST', '/api/v1/recommend/exercise', { userId: 'demo_user_002', days: 7 });
  console.log('  source=' + (r.body.data && r.body.data.source));
  if (r.body.data && r.body.data.plan) {
    console.log('  weeklyDays=' + (r.body.data.plan.weeklyPlan || []).map(function (d) { return d.day + ':' + d.focus; }).join(', '));
  }

  console.log('\n11) AI 对话:');
  r = await request('POST', '/api/v1/chat', { userId: 'demo_user_001', message: '我最近餐后血糖偏高，应该怎么调整？' });
  console.log('  source=' + (r.body.data && r.body.data.source));
  console.log('  reply=' + JSON.stringify(r.body.data && r.body.data.reply));

  console.log('\n12) 鉴权失败:');
  const noAuth = await new Promise(function (resolve) {
    const req = http.request({ host: HOST, port: PORT, path: '/api/v1/analysis/diet?userId=demo_user_001' }, function (res) {
      let chunks = ''; res.on('data', function (c) { chunks += c; }); res.on('end', function () { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); });
    });
    req.end();
  });
  console.log('  status=' + noAuth.status + ' code=' + noAuth.body.code + ' message=' + noAuth.body.message);

  console.log('\n✓ 测试完成');
}

main().catch(function (e) { console.error('测试失败:', e); process.exit(1); });
