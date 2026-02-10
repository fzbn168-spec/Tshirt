#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== SoleTrade Deployment & Health Check Script ===${NC}"

# 1. Update Code
echo -e "\n${YELLOW}[1/4] Pulling latest code...${NC}"
# Ensure we are in the project root
git pull
if [ $? -ne 0 ]; then
    echo -e "${RED}Git pull failed!${NC}"
    exit 1
fi

# 2. Rebuild & Restart Containers
echo -e "\n${YELLOW}[2/4] Rebuilding containers (Backend & Frontend)...${NC}"
# We need to rebuild because:
# - Backend has new Schema (needs migrate in entrypoint or manual) and new Code
# - Frontend has new UI components
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# 3. Database Migration
echo -e "\n${YELLOW}[3/4] Applying Database Migrations...${NC}"
# Wait a bit for backend to be ready
echo "Waiting 10s for backend to initialize..."
sleep 10
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}Database migration failed!${NC}"
    exit 1
fi

# 4. Health Checks
echo -e "\n${YELLOW}[4/4] Performing System Health Checks...${NC}"

# Check Container Status
echo "Checking Docker Containers:"
docker compose -f docker-compose.prod.yml ps

# Check Backend Health Endpoint (Internal)
echo -e "\nChecking Backend API Health..."
# Use docker exec to check inside the container since ports are not exposed to host
if docker compose -f docker-compose.prod.yml exec -T backend wget -qO- http://localhost:3001/api/health | grep "ok"; then
    echo -e "${GREEN}Backend is Healthy!${NC}"
else
    echo -e "${RED}Backend Health Check Failed!${NC}"
    echo "Logs:"
    docker compose -f docker-compose.prod.yml logs --tail=20 backend
fi

# Check Frontend Health (Internal)
echo -e "\nChecking Frontend Health..."
# Use wget --spider to check if page exists
if docker compose -f docker-compose.prod.yml exec -T frontend wget --spider -q http://localhost:3000; then
    echo -e "${GREEN}Frontend is Reachable!${NC}"
else
    echo -e "${RED}Frontend Health Check Failed!${NC}"
    echo "Logs:"
    docker compose -f docker-compose.prod.yml logs --tail=20 frontend
fi

# Feature Verification Checks (Manual)
echo -e "\n${YELLOW}=== P1 Feature Verification Hints ===${NC}"
echo "1. 360 View: Check Product Detail Page JSON response includes 'images360'."
echo "2. Attachments: Check Inquiry creation endpoint accepts 'attachments'."
echo "3. Verification: Check Company Profile endpoint includes 'documents'."

echo -e "\n${GREEN}Deployment Script Completed!${NC}"
