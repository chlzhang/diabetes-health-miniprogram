#!/usr/bin/env bash
# 健康生活助手 - 腾讯云 ECS 一键部署
# 用法:
#   bash deploy.sh
#   bash deploy.sh --ssl-cert /path/to/fullchain.pem --ssl-key /path/to/privkey.pem
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SSL_CERT=""; SSL_KEY=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --ssl-cert) SSL_CERT="$2"; shift 2 ;;
    --ssl-key)  SSL_KEY="$2";  shift 2 ;;
    -h|--help)  sed -n '2,8p' "$0"; exit 0 ;;
    *) echo -e "${RED}未知参数: $1${NC}"; exit 1 ;;
  esac
done

log()   { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# 1. 前置检查
log "1/6 检查 Docker 环境"
command -v docker >/dev/null 2>&1 || err "Docker 未安装"
docker info >/dev/null 2>&1 || err "Docker daemon 未运行"
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  err "docker compose 未安装"
fi
log "  使用: $COMPOSE"

# 2. 检查 .env.production
log "2/6 检查 .env.production"
[[ -f .env.production ]] || err ".env.production 不存在，请先 cp .env.production.example .env.production 并填好"
grep -q "^API_KEY=.\+" .env.production || err ".env.production 中 API_KEY 为空"
grep -q "^LLM_API_KEY=.\+" .env.production || err ".env.production 中 LLM_API_KEY 为空"
log "  ✓ 配置检查通过"

# 3. SSL 证书
log "3/6 处理 SSL 证书"
mkdir -p nginx/ssl
if [[ -n "$SSL_CERT" && -n "$SSL_KEY" ]]; then
  cp "$SSL_CERT" nginx/ssl/fullchain.pem
  cp "$SSL_KEY"  nginx/ssl/privkey.pem
  chmod 600 nginx/ssl/*
  log "  ✓ 已安装新证书"
elif [[ -f nginx/ssl/fullchain.pem && -f nginx/ssl/privkey.pem ]]; then
  warn "  使用 nginx/ssl/ 下现有证书"
else
  err "未提供证书且 nginx/ssl/ 下无证书（用 --ssl-cert/--ssl-key 指定）"
fi

# 4. 拉代码（可选）
log "4/6 更新代码"
if [[ -d .git ]]; then
  git pull --rebase --autostash 2>/dev/null || warn "git pull 失败，使用本地代码"
else
  warn "  非 git 仓库，使用本地代码"
fi

# 5. 重建启动
log "5/6 重建并启动容器"
$COMPOSE down --remove-orphans 2>/dev/null || true
$COMPOSE build --pull
$COMPOSE up -d

# 6. 健康检查
log "6/6 等待服务就绪"
READY=0
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    READY=1; break
  fi
  sleep 2
done
[[ $READY -eq 1 ]] || { $COMPOSE logs --tail=50 app; err "服务启动超时"; }

echo ""
log "部署成功 ✓"
echo ""
echo "  容器状态："
$COMPOSE ps
echo ""
echo "  健康检查: curl http://localhost:3000/health"
echo "  HTTPS 入口: https://你的域名/"
echo "  查看日志: $COMPOSE logs -f app"
echo "  停止服务: $COMPOSE down"
