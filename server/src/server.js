'use strict';
const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, function () {
  console.log('='.repeat(60));
  console.log('  健康守护后端服务已启动');
  console.log('  环境: ' + config.env);
  console.log('  端口: ' + config.port);
  console.log('  LLM:  ' + config.llm.provider + ' / ' + config.llm.model);
  console.log('  健康检查: GET http://localhost:' + config.port + '/health');
  console.log('='.repeat(60));
});

process.on('SIGTERM', function () { server.close(function () { process.exit(0); }); });
process.on('SIGINT', function () { server.close(function () { process.exit(0); }); });
