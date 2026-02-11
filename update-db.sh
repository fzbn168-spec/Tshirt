#!/bin/bash
echo "Syncing schema.prisma to container..."
docker cp backend/prisma/schema.prisma soletrade-backend:/app/prisma/schema.prisma

echo "Pushing database schema changes..."
docker exec soletrade-backend npx prisma db push

echo "Regenerating Prisma Client..."
docker exec soletrade-backend npx prisma generate

echo "Database update completed!"
