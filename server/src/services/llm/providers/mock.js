'use strict';
/**
 * Mock LLM Provider
 * - 当未配置 LLM_API_KEY 时启用
 * - 仍根据用户数据生成"看起来像 LLM 回答"的合理结构，方便前端联调
 * - 真实场景可平滑切换到 openai-compatible
 */

function buildMockDiet(context) {
  const targetKcal = (context && context.targets && context.targets.kcal) || 2000;
  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
  const ratio = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };
  const foodMap = {
    breakfast: [
      { name: '燕麦牛奶', amount: '1 碗', kcal: 220, note: '低 GI' },
      { name: '水煮蛋', amount: '1 个', kcal: 78 },
      { name: '凉拌黄瓜', amount: '小碟', kcal: 25 }
    ],
    lunch: [
      { name: '杂粮饭', amount: '1 碗 (150g)', kcal: 280, note: '低 GI' },
      { name: '清蒸鱼', amount: '100g', kcal: 130, note: '高蛋白' },
      { name: '蒜蓉西兰花', amount: '150g', kcal: 50 }
    ],
    dinner: [
      { name: '糙米饭', amount: '小半碗', kcal: 220, note: '控量' },
      { name: '鸡胸沙拉', amount: '100g', kcal: 165, note: '高蛋白' },
      { name: '凉拌菠菜', amount: '150g', kcal: 35 }
    ],
    snack: [
      { name: '低脂酸奶', amount: '1 杯', kcal: 90 },
      { name: '蓝莓', amount: '一小把', kcal: 40 }
    ]
  };
  return meals.map(function (m) {
    return {
      type: m,
      name: m === 'breakfast' ? '早餐' : m === 'lunch' ? '午餐' : m === 'dinner' ? '晚餐' : '加餐',
      kcal: Math.round(targetKcal * ratio[m]),
      items: foodMap[m]
    };
  });
}

function buildMockExercise(context) {
  const focusMap = {
    1: 'cardio', 2: 'strength', 3: 'cardio', 4: 'rest', 5: 'strength', 6: 'cardio', 7: 'flexibility'
  };
  const itemsMap = {
    cardio: [{ name: '快走', duration: 40, intensity: 'moderate', note: '心率维持在 100-120' }],
    strength: [{ name: '弹力带训练', duration: 30, intensity: 'moderate', note: '上肢+核心' }],
    flexibility: [{ name: '瑜伽拉伸', duration: 25, intensity: 'light' }],
    rest: []
  };
  return [1, 2, 3, 4, 5, 6, 7].map(function (d) {
    const focus = focusMap[d];
    return { day: d, focus: focus, items: itemsMap[focus] };
  });
}

async function chat(messages, options) {
  options = options || {};
  const last = messages[messages.length - 1];
  const userText = (last && last.content) || '';
  // 用 prompt 开头第一行做精确判断（与 prompts.js 中的标题严格匹配）
  const firstLine = userText.split('\n')[0] || '';
  const isExercise = /未来\s*7\s*天的运动计划/.test(firstLine);
  const isDiet = /未来一天的饮食计划/.test(firstLine) || /综合数据/.test(firstLine);
  const isChat = !isExercise && !isDiet;
  const ctx = options.context || {};
  let content = '';
  if (isChat) {
    content = JSON.stringify({
      reply: '（Mock）已收到您的问题。建议：少食多餐、主食选低 GI、餐后散步 15 分钟。具体方案可以点开「我的方案」查看。',
      suggestions: [
        '将白米饭换成杂粮饭',
        '每天餐后步行 10-15 分钟',
        '睡前避免高糖水果'
      ],
      followup: '您目前的用药情况是怎样的？'
    });
  } else if (isExercise) {
    content = JSON.stringify({
      summary: '当前运动量不足，建议每周 5 天中等强度有氧 + 2 天力量训练。',
      weeklyPlan: buildMockExercise(ctx),
      keyPoints: ['餐后 30 分钟散步有助控糖', '力量训练每周不少于 2 次', '运动前后监测血糖'],
      warnings: ['血糖 > 14 mmol/L 或 < 4 mmol/L 时避免剧烈运动'],
      encouragement: '动起来，就是最好的药物！'
    });
  } else {
    content = JSON.stringify({
      summary: '基于您近期的饮食数据，糖分摄入偏高，建议增加蔬菜和优质蛋白比例，主食替换为低 GI 食材。',
      meals: buildMockDiet(ctx),
      keyPoints: ['主食优选低 GI 杂粮', '每餐必有蔬菜', '戒含糖饮料', '细嚼慢咽 20 分钟以上'],
      warnings: [],
      encouragement: '坚持一周就能看到血糖的改善，加油！'
    });
  }
  await new Promise(function (r) { setTimeout(r, 200); });
  return { content: content, usage: null, model: 'mock', raw: null };
}

module.exports = { chat };
