#!/bin/bash
echo "Copying concurrency test script to container..."
docker cp backend/scripts/test-concurrency.ts soletrade-backend:/app/test-concurrency.ts
docker cp backend/tsconfig.json soletrade-backend:/app/tsconfig.json

echo "Installing axios inside container (if missing)..."
docker exec soletrade-backend npm install axios

echo "Running Concurrency Test..."
docker exec soletrade-backend npx ts-node test-concurrency.ts
