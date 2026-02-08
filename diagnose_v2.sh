#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 开始全站诊断 ===${NC}"

# 1. 检查 Docker 容器状态
echo -e "\n${GREEN}[1/5] 检查容器状态...${NC}"
docker compose -f docker-compose.prod.yml ps -a

# 2. 检查后端日志
echo -e "\n${GREEN}[2/5] 检查后端最近 50 行日志...${NC}"
docker compose -f docker-compose.prod.yml logs --tail=50 backend

# 3. 检查后端文件结构 (验证构建是否成功)
echo -e "\n${GREEN}[3/5] 验证后端文件结构...${NC}"
if docker compose -f docker-compose.prod.yml ps | grep -q "soletrade-backend.*Up"; then
    echo "后端容器正在运行，检查 /app/dist 目录："
    docker compose -f docker-compose.prod.yml exec -T backend ls -R /app/dist | head -n 20
else
    echo -e "${RED}后端容器未运行，无法检查文件结构。${NC}"
fi

# 4. 检查数据库文件
echo -e "\n${GREEN}[4/5] 检查数据库文件...${NC}"
if [ -f "backend/data/prod.db" ]; then
    echo "数据库文件存在: backend/data/prod.db"
    ls -l backend/data/prod.db
else
    echo -e "${RED}警告: 数据库文件 backend/data/prod.db 不存在！${NC}"
fi

# 5. 网络连通性测试
echo -e "\n${GREEN}[5/5] 检查本地网络连通性...${NC}"
if curl -I http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "后端健康检查 endpoint (如果存在) 访问成功。"
else
    echo "无法访问 http://localhost:3001 (预期行为，因为可能还没部署健康检查或端口未对外直接暴露)。"
fi

echo -e "\n${GREEN}=== 诊断结束 ===${NC}"
echo "如果发现后端日志有 'libssl.so' 相关错误，请运行 'bash fix-deploy.sh' 应用最新的 OpenSSL 补丁。"
