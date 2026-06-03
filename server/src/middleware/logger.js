'use strict';

function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', function () {
    const dur = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${dur}ms)`);
  });
  next();
}

module.exports = logger;
