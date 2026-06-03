'use strict';
/**
 * OpenAI 兼容 Provider
 * 适用于：OpenAI、DeepSeek、通义千问（DashScope 兼容模式）、豆包、智谱、月之暗面、Ollama 等
 * 文档参考：https://platform.openai.com/docs/api-reference/chat
 */
const config = require('../../../config');

async function chat(messages, options) {
  options = options || {};
  const url = (config.llm.baseUrl || '').replace(/\/+$/, '') + '/chat/completions';
  if (!config.llm.apiKey) {
    throw new Error('LLM_API_KEY 未配置');
  }
  const body = {
    model: config.llm.model,
    messages: messages,
    temperature: options.temperature != null ? options.temperature : config.llm.temperature,
    stream: false
  };
  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.responseFormat) body.response_format = options.responseFormat;

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, config.llm.timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.llm.apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) {
      const text = await res.text();
      const err = new Error('LLM 调用失败: HTTP ' + res.status + ' ' + text.slice(0, 300));
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('LLM 响应缺少 choices[0].message');
    }
    return {
      content: data.choices[0].message.content || '',
      usage: data.usage || null,
      model: data.model || config.llm.model,
      raw: data
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { chat };
