'use strict';
/**
 * LLM Prompt 模板
 * 设计原则：
 * 1) System 角色明确，限定输出领域
 * 2) Context 严格用结构化数据喂入，避免 LLM 算错
 * 3) 强制要求 JSON 输出，字段名清晰
 * 4) Prompt 长度可控，避免无谓 token 消耗
 */

const SYSTEM_PROMPT = `你是一位专业的健康生活管理助手，擅长基于用户身体数据与近期饮食/运动/健康指标记录，给出可执行、循证的个性化生活参考建议。
你的回复必须遵循以下规则：
1) 严格基于提供的 JSON 数据回答，不要编造用户未提供的事实
2) 涉及专业判断时保持谨慎；如涉及具体健康问题，建议用户咨询专业人士
3) 推荐的食材和运动优先选择低 GI、低冲击、可在家进行
4) 数字要具体：热量精确到 10 千卡，时长精确到 5 分钟
5) 鼓励性语言，避免恐吓
6) 输出必须是合法 JSON，不含 markdown 代码块标记`;

function buildDietPlanPrompt(context) {
  return `请基于以下用户数据，生成未来一天的饮食计划。

【用户画像】
${JSON.stringify(context.profile, null, 0)}

【饮食禁忌与目标】
${JSON.stringify(context.preferences, null, 0)}

【近期饮食分析（近 ${context.analysis.diet.rangeDays} 天）】
- 依从率: ${context.analysis.diet.adherence}%
- 餐次分布: 早${context.analysis.diet.mealTypeDist.breakfast} 午${context.analysis.diet.mealTypeDist.lunch} 晚${context.analysis.diet.mealTypeDist.dinner} 加${context.analysis.diet.mealTypeDist.snack}
- 健康评级: 优${context.analysis.diet.healthDist.good} 中${context.analysis.diet.healthDist.ok} 差${context.analysis.diet.healthDist.warn}
- 平均热量: ${context.analysis.diet.kcal.avg} 千卡/天
- 摄入结构: 有蔬菜天数 ${context.analysis.diet.structure.vegDays}, 有蛋白 ${context.analysis.diet.structure.proteinDays}, 甜食 ${context.analysis.diet.structure.sweetDays}, 含糖饮料 ${context.analysis.diet.structure.sweetDrinkDays}
- 关键问题: ${(context.analysis.diet.issues || []).join('；') || '无'}

【推荐约束】
- 目标热量: ${context.targets.kcal} 千卡
- 目标宏量: 蛋白质 ${context.targets.macros.protein_g}g, 碳水 ${context.targets.macros.carb_g}g, 脂肪 ${context.targets.macros.fat_g}g
- 餐次热量分配: 早餐 25% / 午餐 35% / 晚餐 30% / 加餐 10%

请输出 JSON：
{
  "summary": "1-2 句针对该用户的饮食总评",
  "meals": [
    { "type": "breakfast|lunch|dinner|snack", "name": "餐次名称", "kcal": 数值, "items": [{"name":"菜品名","amount":"份量描述","kcal":数值,"note":"可选：低 GI/高蛋白等"}] }
  ],
  "keyPoints": ["重点提示 1", "重点提示 2"],
  "warnings": ["如有禁忌/异常，请列出"],
  "encouragement": "一句鼓励的话"
}`;
}

function buildExercisePlanPrompt(context) {
  return `请基于以下用户数据，生成未来 7 天的运动计划。

【用户画像】
${JSON.stringify(context.profile, null, 0)}

【运动限制】
${JSON.stringify(context.preferences, null, 0)}

【近期运动分析（近 ${context.analysis.exercise.rangeDays} 天）】
- 总时长: ${context.analysis.exercise.totalMinutes} 分钟 (目标 150 分钟/周)
- 达标率: ${context.analysis.exercise.goalPercent}%
- 活跃天数: ${context.analysis.exercise.activeDays}
- 强度分布(次数): 轻${context.analysis.exercise.intensityDist.light} 中${context.analysis.exercise.intensityDist.moderate} 高${context.analysis.exercise.intensityDist.vigorous}
- 类型多样性: ${context.analysis.exercise.varietyScore} 种
- 连续打卡: ${context.analysis.exercise.streak} 天
- 关键问题: ${(context.analysis.exercise.issues || []).join('；') || '无'}

请输出 JSON：
{
  "summary": "1-2 句针对该用户的运动总评",
  "weeklyPlan": [
    { "day": 1, "focus": "cardio|strength|flexibility|rest", "items": [{"name":"运动名","duration": 分钟数, "intensity": "light|moderate|vigorous", "note": "可选备注"}] }
  ],
  "keyPoints": ["重点提示"],
  "warnings": ["如有运动风险请列出"],
  "encouragement": "一句鼓励"
}`;
}

function buildComprehensivePlanPrompt(context) {
  return `请基于以下综合数据，生成饮食 + 运动 + 风险提示的完整个性化方案。

【用户画像】
${JSON.stringify(context.profile, null, 0)}

【偏好与禁忌】
${JSON.stringify(context.preferences, null, 0)}

【综合分析】
- 整体依从评分: ${context.analysis.overallScore.total} / 100（饮食 ${context.analysis.overallScore.components.diet}, 运动 ${context.analysis.overallScore.components.exercise}, 血糖 ${context.analysis.overallScore.components.bloodSugar}）
- 风险等级: ${context.analysis.riskLevel.label}
- 餐后血糖响应: ${JSON.stringify(context.analysis.postMealResponse)}
- 运动对血糖影响: ${JSON.stringify(context.analysis.exerciseBsEffect)}
- 关键洞察: ${JSON.stringify(context.analysis.insights)}

【推荐约束】
- 目标热量: ${context.targets.kcal} 千卡
- 目标宏量: 蛋白质 ${context.targets.macros.protein_g}g, 碳水 ${context.targets.macros.carb_g}g, 脂肪 ${context.targets.macros.fat_g}g

请输出 JSON：
{
  "summary": "3 句话内总评",
  "riskAssessment": { "level": "low|medium|high", "points": ["风险点"] },
  "dietPlan": { /* 同 buildDietPlanPrompt 的结构 */ },
  "exercisePlan": { /* 同 buildExercisePlanPrompt 的结构 */ },
  "keyPoints": ["全局重点 1-3 条"],
  "warnings": ["如有需专业判断的内容等"],
  "nextWeekGoals": ["下周可执行的小目标"]
}`;
}

function buildChatPrompt(context, history, userMessage) {
  const safeHistory = (history || []).slice(-8).map(function (h) {
    return { role: h.role, content: String(h.content || '').slice(0, 500) };
  });
  return `你是健康生活助手。基于以下上下文回答用户问题。

【用户画像】
${JSON.stringify(context.profile || {}, null, 0)}

【最近健康状态摘要】
- 依从评分: ${context.analysis.overallScore.total}
- 风险等级: ${context.analysis.riskLevel.label}
- 血糖 TIR: ${context.analysis.bloodSugar.tirPercent}%
- 运动达标率: ${context.analysis.exercise.goalPercent}%
- 关键问题: ${(context.analysis.insights || []).map(function (i) { return i.message; }).join('；') || '无'}

【历史对话】
${safeHistory.map(function (h) { return h.role + ': ' + h.content; }).join('\n')}

【用户新消息】
${userMessage}

请输出 JSON：
{
  "reply": "对用户的回答（自然语言，2-4 句话）",
  "suggestions": ["可选：1-3 条具体行动建议"],
  "followup": "可选：可以追问的问题"
}`;
}

module.exports = {
  SYSTEM_PROMPT,
  buildDietPlanPrompt,
  buildExercisePlanPrompt,
  buildComprehensivePlanPrompt,
  buildChatPrompt
};
