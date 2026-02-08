#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 开始彻底重置前端 ===${NC}"

# 1. 停止前端容器
echo -e "\n${GREEN}[1/5] 停止旧容器...${NC}"
docker compose -f docker-compose.prod.yml stop frontend
docker compose -f docker-compose.prod.yml rm -f frontend

# 2. 删除旧镜像 (强制清理)
echo -e "\n${GREEN}[2/5] 删除旧镜像...${NC}"
docker rmi soletrade-frontend:latest || true
# 尝试删除可能存在的无标签镜像
docker image prune -f

# 3. 强制拉取代码
echo -e "\n${GREEN}[3/5] 拉取最新代码...${NC}"
git fetch origin
git reset --hard origin/main

# 4. 强制无缓存构建
echo -e "\n${GREEN}[4/5] 重新构建镜像 (无缓存)...${NC}"
echo "此过程可能需要几分钟，请勿中断..."
docker compose -f docker-compose.prod.yml build --no-cache frontend

# 5. 启动新容器
echo -e "\n${GREEN}[5/5] 启动新服务...${NC}"
docker compose -f docker-compose.prod.yml up -d frontend

echo -e "\n${GREEN}=== 重置完成 ===${NC}"
echo "请按 Ctrl+F5 强制刷新浏览器。"
echo "如果更新成功，您应该能看到侧边栏第一项变成了 '概览 (CN)' 或 'Overview (EN)'。"
