#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 开始彻底重置后端 ===${NC}"

# 1. 停止后端容器
echo -e "\n${GREEN}[1/5] 停止旧容器...${NC}"
docker compose -f docker-compose.prod.yml stop backend
docker compose -f docker-compose.prod.yml rm -f backend

# 2. 删除旧镜像
echo -e "\n${GREEN}[2/5] 删除旧镜像...${NC}"
docker rmi soletrade-backend:latest || true
docker image prune -f

# 3. 拉取最新代码
echo -e "\n${GREEN}[3/5] 拉取最新代码...${NC}"
git fetch origin
git reset --hard origin/main

# 4. 强制无缓存构建
echo -e "\n${GREEN}[4/5] 重新构建镜像 (无缓存)...${NC}"
echo "此过程可能需要几分钟，请勿中断..."
docker compose -f docker-compose.prod.yml build --no-cache backend

# 5. 启动新服务
echo -e "\n${GREEN}[5/5] 启动新服务...${NC}"
docker compose -f docker-compose.prod.yml up -d backend

echo -e "\n${GREEN}=== 后端重置完成 ===${NC}"
echo "正在等待服务初始化 (15秒)..."
sleep 15
docker compose -f docker-compose.prod.yml logs --tail 20 backend
