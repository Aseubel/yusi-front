#!/bin/bash

# 步骤1：清理（不再执行全量清理，保留构建缓存）
echo "清理无用镜像..."
docker image prune -f

# 步骤2：拉取代码
echo "拉取最新代码..."
git pull

# 步骤3：Docker构建 (利用 Dockerfile 中的分层缓存)
echo "构建Docker镜像..."
docker compose build

# 步骤4：启动服务
echo "启动服务..."
docker compose up -d

# 步骤5：事后清理
echo "清理悬空镜像..."
docker image prune -af