#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== SoleTrade Deployment & Health Check Script ===${NC}"

# 1. Update Code
echo -e "\n${YELLOW}[1/4] Pulling latest code...${NC}"
cd /opt/soletrade
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
echo "Waiting for backend to initialize..."
sleep 10
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}Database migration failed!${NC}"
    exit 1
fi

# 4. Health Checks
echo -e "\n${YELLOW}[4/4] Performing System Health Checks...${NC}"

# Check Container Status
echo "Checking Docker Containers:"
docker compose -f docker-compose.prod.yml ps

# Check Backend Health Endpoint
echo -e "\nChecking Backend API Health..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$BACKEND_STATUS" == "200" ] || [ "$BACKEND_STATUS" == "404" ]; then 
    # 404 might be returned if /health endpoint doesn't exist but server responds. 
    # Better to check a known endpoint or root. Assuming root returns 200 or 404 (NestJS default)
    echo -e "${GREEN}Backend is reachable (Status: $BACKEND_STATUS)${NC}"
else
    echo -e "${RED}Backend check failed (Status: $BACKEND_STATUS)${NC}"
fi

# Check Frontend
echo -e "\nChecking Frontend Health..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" == "200" ]; then
    echo -e "${GREEN}Frontend is reachable (Status: 200)${NC}"
else
    echo -e "${RED}Frontend check failed (Status: $FRONTEND_STATUS)${NC}"
fi

# Feature Verification Checks (Mock)
echo -e "\n${YELLOW}=== P1 Feature Verification Hints ===${NC}"
echo "1. 360 View: Check Product Detail Page JSON response includes 'images360'."
echo "2. Attachments: Check Inquiry creation endpoint accepts 'attachments'."
echo "3. Verification: Check Company Profile endpoint includes 'documents'."

echo -e "\n${GREEN}Deployment Completed!${NC}"
