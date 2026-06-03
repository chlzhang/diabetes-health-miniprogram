'use strict';
/**
 * 统一 API 响应包装
 * 所有接口返回结构：
 * {
 *   code: 0 业务成功；其他 业务错误码
 *   message: 文本说明
 *   data: 业务数据
 *   timestamp: 服务端时间戳
 * }
 */

// 业务错误码
const codes = {
  OK: 0,
  PARAM_INVALID: 4001,
  UNAUTHORIZED: 4003,
  NOT_FOUND: 4004,
  LLM_UNAVAILABLE: 5001,
  LLM_INVALID_RESPONSE: 5002,
  LLM_TIMEOUT: 5003,
  DATA_INSUFFICIENT: 4005,
  INTERNAL_ERROR: 5000
};

function ok(res, data, message) {
  return res.json({
    code: codes.OK,
    message: message || 'ok',
    data: data || null,
    timestamp: Date.now()
  });
}

function fail(res, code, message, httpStatus, details) {
  return res.status(httpStatus || 200).json({
    code: code,
    message: message || 'error',
    data: details || null,
    timestamp: Date.now()
  });
}

function paginate(list, page, pageSize) {
  page = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, Math.min(200, parseInt(pageSize, 10) || 20));
  const start = (page - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    pagination: { page: page, pageSize: pageSize, total: list.length, totalPages: Math.ceil(list.length / pageSize) }
  };
}

module.exports = { ok, fail, codes, paginate };
