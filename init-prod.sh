#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== 开始生产环境初始化 ===${NC}"

# 1. 重新构建后端以应用 package.json 的变更
echo -e "\n${GREEN}[1/3] 更新配置并重构后端...${NC}"
docker compose -f docker-compose.prod.yml up -d --build backend

# 2. 等待服务就绪
echo -e "\n${GREEN}[2/3] 等待服务启动 (10秒)...${NC}"
sleep 10

# 3. 运行数据填充
echo -e "\n${GREEN}[3/3] 正在填充初始数据...${NC}"
if docker compose -f docker-compose.prod.yml exec -T backend npx prisma db seed; then
    echo -e "${GREEN}数据填充成功！${NC}"
else
    echo -e "${RED}数据填充失败，请检查日志。${NC}"
fi

echo -e "\n${GREEN}=== 初始化完成 ===${NC}"
echo "接下来请创建管理员账号："
echo "docker compose -f docker-compose.prod.yml exec backend node -r ts-node/register scripts/create-admin.ts 'admin@soletrade.com' 'Admin123!' 'Super Admin'"
