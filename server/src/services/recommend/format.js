'use strict';
/**
 * 格式转换器 - 本地规则生成结果 → LLM 风格 JSON
 * 目的：让前端不感知"是 LLM 生成的方案"还是"本地方案"。
 *       LLM 失败时，本地方案无缝填充 `plan` 字段。
 */
const FALLBACK_TAG = '（本地规则方案 · AI 暂时不可用）';

function safeGet(obj, path, def) {
  try {
    var cur = obj;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return def;
      cur = cur[parts[i]];
    }
    return cur == null ? def : cur;
  } catch (e) { return def; }
}

function buildDietPlan(localDiet, ctx) {
  if (!localDiet) return null;
  var macros = localDiet.macros || {};
  return {
    summary: '今日饮食方案' + FALLBACK_TAG,
    meals: (localDiet.meals || []).map(function (m) {
      return {
        type: m.id,
        name: m.name,
        kcal: m.targetKcal,
        items: (m.items || []).map(function (it) {
          var dish = it.dish || {};
          var note = it.role || '';
          if (dish.tags && dish.tags.length) note += (note ? ' · ' : '') + dish.tags.join('/');
          return {
            name: (dish.icon ? dish.icon + ' ' : '') + dish.name,
            amount: dish.unit,
            kcal: dish.kcal,
            note: note
          };
        })
      };
    }),
    keyPoints: [
      '总热量 ' + localDiet.targetKcal + ' 千卡 (TDEE ' + localDiet.tdee + ')',
      '宏量分配：蛋白 ' + macros.protein_g + 'g · 碳水 ' + macros.carb_g + 'g · 脂肪 ' + macros.fat_g + 'g',
      '主食优选低 GI 杂粮，每餐搭配蔬菜'
    ],
    warnings: safeGet(ctx, 'analysis.diet.issues', []).slice(0, 3),
    encouragement: '坚持一周，你能看到变化！'
  };
}

function buildExercisePlan(localExercise, ctx) {
  if (!localExercise) return null;
  return {
    summary: '本周运动计划' + FALLBACK_TAG,
    weeklyPlan: (localExercise.weeklyPlan || []).map(function (d) {
      return {
        day: d.day,
        focus: d.focus,
        items: (d.items || []).map(function (it) {
          var typeLabel = it.type === 'cardio' ? '有氧运动'
            : it.type === 'strength' ? '力量训练'
            : it.type === 'flexibility' ? '柔韧/拉伸'
            : '休息日';
          return {
            name: (it.icon ? it.icon + ' ' : '') + it.name,
            duration: it.plannedMinutes,
            intensity: it.intensity,
            note: typeLabel
          };
        })
      };
    }),
    keyPoints: [
      '每周累计 150 分钟中等强度运动为目标',
      '运动前热身 5 分钟，运动后拉伸 5 分钟',
      '出现胸闷、头晕等不适立即停止'
    ],
    warnings: [],
    encouragement: '循序渐进，别忘了打卡！'
  };
}

function buildComprehensivePlan(localFull, ctx) {
  if (!localFull) return null;
  var analysis = (ctx && ctx.analysis) || {};
  var risk = analysis.riskLevel || { level: 'medium', label: '中等风险' };
  var score = (analysis.overallScore && analysis.overallScore.total) || 0;
  return {
    summary: '完整健康方案' + FALLBACK_TAG,
    riskAssessment: {
      level: risk.level,
      points: (analysis.insights || []).slice(0, 3).map(function (i) { return i.message; })
    },
    dietPlan: buildDietPlan(localFull.diet, ctx),
    exercisePlan: buildExercisePlan(localFull.exercise, ctx),
    keyPoints: [
      '整体评分 ' + score + ' / 100',
      '饮食 / 运动 / 血糖参考对应模块的具体数据',
      '建议每周固定 1 个时间点复盘本周数据'
    ],
    warnings: risk.level === 'high' ? ['风险等级偏高，建议持续记录并咨询专业人士'] : [],
    nextWeekGoals: [
      '连续 5 天完成今日运动目标',
      '晚餐主食减半，提前到 19 点前完成',
      '每天餐后步行 10-15 分钟有助控糖'
    ]
  };
}

function buildChatFallback(ctx, userMessage) {
  var analysis = (ctx && ctx.analysis) || {};
  var risk = analysis.riskLevel || { label: '未知' };
  var score = (analysis.overallScore && analysis.overallScore.total) || 0;
  var tir = (analysis.bloodSugar && analysis.bloodSugar.tirPercent) || 0;
  var msg = userMessage || '';
  var reply = '';
  if (/指标|空腹|餐后|数值|趋势/.test(msg)) {
    reply = 'AI 助手暂时不可用，已切换到本地建议。您的整体健康评分 ' + score + '，指标达标率 ' + tir + '%，风险等级 ' + risk.label + '。建议优先关注「餐后 2 小时」值，目标 ≤ 7.8 mmol/L；如频繁出现请持续记录并关注趋势。';
  } else if (/吃|饮食|食谱|餐|gi|糖|主食|水果|喝/.test(msg)) {
    reply = 'AI 助手暂时不可用。饮食建议遵循「低 GI、控总量、按时按量」三原则。详细方案可打开「方案」页查看为您生成的今日推荐。';
  } else if (/运动|走|跑|练|健身|瑜伽|游泳|骑车|力量/.test(msg)) {
    reply = 'AI 助手暂时不可用。运动目标为每周累计 150 分钟中等强度有氧 + 2 次力量训练。具体安排可打开「方案」页查看。';
  } else if (/睡|压力|作息|熬夜/.test(msg)) {
    reply = 'AI 助手暂时不可用。睡眠和压力对整体健康影响很大，建议保持规律作息（7-8 小时），尽量在 23 点前入睡。';
  } else {
    reply = 'AI 助手暂时不可用，已切换到本地兜底。您的整体健康评分 ' + score + '，风险等级 ' + risk.label + '。您可以打开「方案」页查看为您生成的个性化建议，或继续记录今天的饮食与运动。';
  }
  return {
    reply: reply,
    suggestions: [
      '查看「方案」页获取完整推荐',
      '继续记录今天的饮食与运动',
      '定期记录数据并复盘趋势'
    ],
    followup: '您最近的整体健康评分有变化吗？'
  };
}

module.exports = {
  buildDietPlan: buildDietPlan,
  buildExercisePlan: buildExercisePlan,
  buildComprehensivePlan: buildComprehensivePlan,
  buildChatFallback: buildChatFallback,
  FALLBACK_TAG: FALLBACK_TAG
};
