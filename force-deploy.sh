#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 开始强制更新前端 ===${NC}"

# 1. 强制拉取最新代码
echo -e "\n${GREEN}[1/3] 拉取最新代码...${NC}"
git fetch origin
git reset --hard origin/main

# 2. 强制不使用缓存构建
echo -e "\n${GREEN}[2/3] 强制重建前端镜像 (不使用缓存)...${NC}"
echo "注意：这一步可能需要几分钟，请耐心等待。"
docker compose -f docker-compose.prod.yml build --no-cache frontend

# 3. 重启容器
echo -e "\n${GREEN}[3/3] 重启前端容器...${NC}"
docker compose -f docker-compose.prod.yml up -d frontend

echo -e "\n${GREEN}=== 部署完成 ===${NC}"
echo "请刷新浏览器。如果您在页面底部看到 'v1.1.0'，说明更新成功！"
