'use strict';
const { fail, codes } = require('../utils/response');

function notFoundHandler(req, res) {
  return fail(res, codes.NOT_FOUND, '接口不存在: ' + req.method + ' ' + req.path, 404);
}

function errorHandler(err, req, res, next) {
  console.error('[Error]', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  return fail(res, codes.INTERNAL_ERROR, err && err.message ? err.message : '服务器内部错误', 500);
}

module.exports = { notFoundHandler, errorHandler };
