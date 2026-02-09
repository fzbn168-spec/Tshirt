#!/bin/bash
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== Updating Seed Script ===${NC}"
# Pull latest code first
git pull

echo -e "\n${GREEN}=== Re-compiling Seed Script ===${NC}"
# We need to re-compile the seed script inside the container because we changed it
docker compose -f docker-compose.prod.yml exec backend npx tsc prisma/seed.ts --module commonjs --target ES2023 --moduleResolution node --esModuleInterop --skipLibCheck

echo -e "\n${GREEN}=== Running Seed ===${NC}"
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed

echo -e "\n${GREEN}=== Done ===${NC}"
