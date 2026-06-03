'use strict';
/**
 * LLM 兜底测试脚本
 *
 * 模拟 LLM 调用失败（用无法访问的 baseUrl + 错误的 apiKey），
 * 验证后端能够正确回退到本地方案生成，并返回与 LLM 输出结构一致的 plan。
 *
 * 用法（在 server 目录下）：
 *   node scripts/test-fallback.js
 *
 * 期望：所有断言通过，控制台显示 "✓ 所有断言通过"
 */

// 必须在 require app 之前覆盖环境变量
process.env.LLM_PROVIDER = 'openai-compatible';
process.env.LLM_API_KEY = 'sk-test-invalid-key';
process.env.LLM_BASE_URL = 'http://127.0.0.1:1'; // 不可达，会立即 ECONNREFUSED
process.env.LLM_TIMEOUT_MS = '2000';
process.env.API_KEY = 'dev-secret';
process.env.NODE_ENV = 'development';

const http = require('http');
const { seed } = require('./seed');
const app = require('../src/app');

function request(server, method, path, body) {
  return new Promise(function (resolve, reject) {
    const data = body ? JSON.stringify(body) : null;
    const port = server.address().port;
    const req = http.request({
      host: '127.0.0.1', port: port, method: method, path: path,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'dev-secret',
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

function ok(label, cond, extra) {
  const mark = cond ? '✓' : '✗';
  console.log('  ' + mark + ' ' + label + (extra ? '   ' + extra : ''));
  return !!cond;
}

async function main() {
  console.log('1) 初始化种子数据...');
  seed();

  console.log('\n2) 启动 in-process 测试服务 (LLM 故意配错)...');
  const server = app.listen(0);
  await new Promise(function (r) { server.on('listening', r); });
  console.log('   监听端口: ' + server.address().port);

  let pass = true;

  // 1. diet
  console.log('\n3) POST /api/v1/recommend/diet');
  let r = await request(server, 'POST', '/api/v1/recommend/diet', { userId: 'demo_user_001', days: 7 });
  const diet = r.body && r.body.data;
  pass &= ok('source === "rule"', diet && diet.source === 'rule', '实际: ' + (diet && diet.source));
  pass &= ok('ok === true', diet && diet.ok === true);
  pass &= ok('plan 存在', !!(diet && diet.plan));
  pass &= ok('plan.meals.length === 4', diet && diet.plan && Array.isArray(diet.plan.meals) && diet.plan.meals.length === 4);
  pass &= ok('summary 含 fallback 标识', diet && diet.plan && /本地规则方案/.test(diet.plan.summary || ''));
  pass &= ok('warning 字段存在（记录 LLM 错误）', diet && typeof diet.warning === 'string');
  if (diet && diet.plan && diet.plan.meals && diet.plan.meals[0]) {
    const m0 = diet.plan.meals[0];
    console.log('     第一餐:', m0.type, m0.kcal + 'kcal, items=' + (m0.items || []).length);
  }

  // 2. exercise
  console.log('\n4) POST /api/v1/recommend/exercise');
  r = await request(server, 'POST', '/api/v1/recommend/exercise', { userId: 'demo_user_001', days: 7 });
  const ex = r.body && r.body.data;
  pass &= ok('source === "rule"', ex && ex.source === 'rule', '实际: ' + (ex && ex.source));
  pass &= ok('weeklyPlan.length === 7', ex && ex.plan && ex.plan.weeklyPlan && ex.plan.weeklyPlan.length === 7);
  if (ex && ex.plan && ex.plan.weeklyPlan) {
    console.log('     周计划:', ex.plan.weeklyPlan.map(function (d) { return d.day + ':' + d.focus; }).join(', '));
  }

  // 3. comprehensive
  console.log('\n5) POST /api/v1/recommend/comprehensive');
  r = await request(server, 'POST', '/api/v1/recommend/comprehensive', { userId: 'demo_user_001', days: 7 });
  const comp = r.body && r.body.data;
  pass &= ok('source === "rule"', comp && comp.source === 'rule', '实际: ' + (comp && comp.source));
  pass &= ok('dietPlan 存在', comp && comp.plan && comp.plan.dietPlan);
  pass &= ok('exercisePlan 存在', comp && comp.plan && comp.plan.exercisePlan);
  pass &= ok('riskAssessment 存在', comp && comp.plan && comp.plan.riskAssessment);
  pass &= ok('nextWeekGoals 非空', comp && comp.plan && Array.isArray(comp.plan.nextWeekGoals) && comp.plan.nextWeekGoals.length > 0);

  // 4. chat
  console.log('\n6) POST /api/v1/chat (问"血糖")');
  r = await request(server, 'POST', '/api/v1/chat', { userId: 'demo_user_001', message: '我最近餐后血糖偏高怎么办？' });
  const chatR = r.body && r.body.data;
  pass &= ok('source === "rule"', chatR && chatR.source === 'rule');
  pass &= ok('reply.reply 存在', chatR && chatR.reply && chatR.reply.reply);
  pass &= ok('reply.suggestions 非空', chatR && chatR.reply && Array.isArray(chatR.reply.suggestions));
  console.log('     回复:', chatR && chatR.reply && (chatR.reply.reply || '').slice(0, 80));

  console.log('\n7) POST /api/v1/chat (问"吃")');
  r = await request(server, 'POST', '/api/v1/chat', { userId: 'demo_user_001', message: '今天晚餐吃什么好？' });
  const chatR2 = r.body && r.body.data;
  pass &= ok('source === "rule"', chatR2 && chatR2.source === 'rule');
  console.log('     回复:', chatR2 && chatR2.reply && (chatR2.reply.reply || '').slice(0, 80));

  // 5. 用户不存在（应返回 404）
  console.log('\n8) POST /api/v1/recommend/diet (不存在的用户)');
  r = await request(server, 'POST', '/api/v1/recommend/diet', { userId: 'no_such_user', days: 7 });
  pass &= ok('HTTP code !== 0', r.body && r.body.code === 4004, '实际 code: ' + (r.body && r.body.code));

  server.close();
  console.log('\n' + (pass ? '✓ 所有断言通过' : '✗ 有断言失败'));
  process.exit(pass ? 0 : 1);
}

main().catch(function (e) { console.error('测试失败:', e); process.exit(1); });
