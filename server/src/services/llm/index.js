'use strict';
/**
 * LLM 调度器
 * - 根据配置选择 provider
 * - 提供统一的 chat 接口
 * - 包含 JSON 解析容错（兼容 ```json ... ``` 包裹）
 * - 自动重试一次（仅对超时/网络错误）
 */
const config = require('../../config');
const prompts = require('./prompts');

const providers = {
  'openai-compatible': require('./providers/openai-compatible'),
  'mock': require('./providers/mock')
};

function pickProvider() {
  const name = config.llm.provider;
  if (providers[name]) return providers[name];
  // 兜底：如果选了 openai-compatible 但没有 key，自动降级到 mock
  if (name === 'openai-compatible' && !config.llm.apiKey) {
    console.warn('[LLM] LLM_API_KEY 未配置，自动降级为 mock provider');
    return providers.mock;
  }
  return providers.mock;
}

function parseJsonContent(text) {
  if (!text) return null;
  // 去掉 markdown 代码块
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // 截取首个 { 到最后一个 }
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first >= 0 && last > first) t = t.slice(first, last + 1);
  try { return JSON.parse(t); } catch (e) { return null; }
}

async function chat(messages, options) {
  const provider = pickProvider();
  const last = messages[messages.length - 1];
  let attempts = 0;
  const maxAttempts = options && options.retries != null ? options.retries : 1;
  let lastErr = null;
  while (attempts <= maxAttempts) {
    try {
      const res = await provider.chat(messages, options || {});
      const parsed = parseJsonContent(res.content);
      if (!parsed && options && options.requireJson) {
        throw new Error('LLM 响应无法解析为 JSON');
      }
      return { parsed: parsed, content: res.content, usage: res.usage, model: res.model, provider: provider.name || config.llm.provider };
    } catch (err) {
      lastErr = err;
      attempts++;
      if (attempts > maxAttempts) break;
      // 仅对可重试错误重试
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429) break;
    }
  }
  const e = new Error('LLM 调用失败: ' + (lastErr && lastErr.message));
  e.cause = lastErr;
  throw e;
}

function getProviderName() { return config.llm.provider; }

module.exports = {
  chat: chat,
  getProviderName: getProviderName,
  parseJsonContent: parseJsonContent,
  prompts: prompts
};
