#!/bin/bash
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Health Check ===${NC}"

# 1. Check Containers
echo -e "\n${GREEN}[1/3] Checking Containers...${NC}"
docker compose -f docker-compose.prod.yml ps

# 2. Check Backend
echo -e "\n${GREEN}[2/3] Checking Backend (Internal)...${NC}"
# We try to curl the backend from inside the nginx container (since it shares the network)
docker compose -f docker-compose.prod.yml exec nginx curl -I http://backend:3001 || echo -e "${RED}Backend Unreachable${NC}"

# 3. Check Frontend
echo -e "\n${GREEN}[3/3] Checking Frontend (Internal)...${NC}"
docker compose -f docker-compose.prod.yml exec nginx curl -I http://frontend:3000 || echo -e "${RED}Frontend Unreachable${NC}"
