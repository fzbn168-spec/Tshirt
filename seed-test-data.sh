#!/bin/bash
# Seed Test Data for Manual Verification

echo "Copying seed script to container..."
docker cp backend/scripts/seed-test-order.ts soletrade-backend:/app/seed-test-order.ts
docker cp backend/tsconfig.json soletrade-backend:/app/tsconfig.json

echo "Running seed script..."
docker exec soletrade-backend npx ts-node seed-test-order.ts

echo "Done!"
