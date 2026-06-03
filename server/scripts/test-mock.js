'use strict';
const mock = require('../src/services/llm/providers/mock');

async function test(label, messages) {
  const r = await mock.chat(messages, {});
  const obj = JSON.parse(r.content);
  console.log(label + ':');
  if (obj.summary) console.log('  summary=' + obj.summary.slice(0, 80));
  if (obj.meals) console.log('  meals count=' + obj.meals.length);
  if (obj.weeklyPlan) console.log('  weeklyPlan days=' + obj.weeklyPlan.length);
  if (obj.reply) console.log('  reply=' + obj.reply.slice(0, 80));
}

async function main() {
  await test('DIET', [
    { role: 'system', content: 'sys' },
    { role: 'user', content: '请基于以下用户数据，生成未来一天的饮食计划。\n\n请输出 JSON' }
  ]);
  await test('EXERCISE', [
    { role: 'system', content: 'sys' },
    { role: 'user', content: '请基于以下用户数据，生成未来 7 天的运动计划。\n\n请输出 JSON' }
  ]);
  await test('CHAT', [
    { role: 'system', content: 'sys' },
    { role: 'user', content: '你是糖前期健康管理助手。\n\n【用户新消息】\n血糖偏高怎么办？\n\n请输出 JSON' }
  ]);
}

main().catch(console.error);
