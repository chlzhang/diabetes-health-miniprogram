# ============================================
#  健康生活助手 - 后端服务镜像
#  两阶段构建，最终镜像约 150MB
# ============================================

# ----- Stage 1: 安装依赖 -----
FROM node:18-alpine AS deps
WORKDIR /app

# 国内构建可换源（按需取消注释）
# RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ----- Stage 2: 运行时镜像 -----
FROM node:18-alpine AS runtime
WORKDIR /app

# 安装 wget 用于 HEALTHCHECK（alpine 默认有）
RUN apk add --no-cache wget

# 用非 root 用户运行
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# 从构建阶段拷贝依赖
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# 拷贝应用代码
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src

# 数据目录（运行时由 docker-compose volume 挂载）
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
