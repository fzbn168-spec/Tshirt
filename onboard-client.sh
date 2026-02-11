#!/bin/bash
# Wrapper to run the onboarding script inside Docker
# Usage: ./onboard-client.sh "My Company" "email@example.com"

if [ "$#" -ne 2 ]; then
    echo "Usage: ./onboard-client.sh <CompanyName> <AdminEmail>"
    exit 1
fi

docker cp backend/scripts/onboard-beta-client.ts soletrade-backend:/app/onboard-beta-client.ts
# Ensure tsconfig is there (it should be, but just in case)
docker cp backend/tsconfig.json soletrade-backend:/app/tsconfig.json

echo "Running Onboarding Script..."
docker exec soletrade-backend npx ts-node onboard-beta-client.ts "$1" "$2"
