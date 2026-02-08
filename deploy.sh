#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

# 1. 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker first: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 2. 确定 Docker Compose 命令
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    exit 1
fi

echo "Using compose command: $COMPOSE_CMD"

# 3. 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found.${NC}"
    echo "Please copy .env.example to .env and configure it first."
    exit 1
fi

# 4. 停止旧容器
echo -e "${GREEN}Stopping existing containers...${NC}"
$COMPOSE_CMD down

# 5. 构建新镜像
echo -e "${GREEN}Building new images...${NC}"
$COMPOSE_CMD build --no-cache

# 6. 启动容器
echo -e "${GREEN}Starting containers...${NC}"
$COMPOSE_CMD up -d

# 7. 等待服务就绪
echo -e "${GREEN}Waiting for services to initialize (15s)...${NC}"
sleep 15

# 8. 运行数据库迁移
echo -e "${GREEN}Running database migrations...${NC}"
# 注意：在生产环境中，prod.db 需要位于 volume 中以持久化
$COMPOSE_CMD exec -T backend npx prisma migrate deploy

echo -e "${GREEN}Deployment complete!${NC}"
echo "Frontend: http://localhost:3000 (or your server IP)"
echo "Backend:  http://localhost:3001"
