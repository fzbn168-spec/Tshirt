#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 开始修复部署 ===${NC}"

# 1. 修复 prod.db 可能被 Docker 误创建为文件夹的问题
if [ -d "backend/prisma/prod.db" ]; then
    echo -e "${RED}发现 prod.db 是文件夹，正在删除...${NC}"
    rm -rf backend/prisma/prod.db
fi

if [ ! -f "backend/prisma/prod.db" ]; then
    echo -e "${GREEN}创建空的 prod.db 文件...${NC}"
    mkdir -p backend/prisma
    touch backend/prisma/prod.db
fi

# 2. 重启所有服务
echo -e "${GREEN}正在重启服务...${NC}"
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 3. 等待后端启动
echo -e "${GREEN}等待后端服务初始化 (10秒)...${NC}"
sleep 10

# 4. 检查后端状态并运行迁移
if docker compose -f docker-compose.prod.yml ps | grep -q "soletrade-backend.*Up"; then
    echo -e "${GREEN}后端运行正常，正在运行数据库迁移...${NC}"
    docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
    
    # 5. 重启 Nginx 确保连接
    echo -e "${GREEN}重启 Nginx...${NC}"
    docker compose -f docker-compose.prod.yml restart nginx
    
    echo -e "${GREEN}=== 修复完成！ ===${NC}"
    echo -e "请尝试访问: https://aif1688.com"
else
    echo -e "${RED}错误：后端服务未能正常启动。${NC}"
    echo "正在获取错误日志..."
    docker compose -f docker-compose.prod.yml logs backend
fi
