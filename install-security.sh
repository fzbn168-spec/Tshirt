#!/bin/bash
echo "Installing Security Dependencies..."
docker exec soletrade-backend npm install helmet @nestjs/throttler
