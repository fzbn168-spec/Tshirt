#!/bin/bash

# ====================================================
# SoleTrade Server Initialization Script (Ubuntu)
# Usage: sudo ./setup-server.sh
# ====================================================

echo "🚀 Starting Server Setup for SoleTrade..."

# 1. Update System
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Git & Curl
echo "🛠️ Installing Git & Curl..."
apt-get install -y git curl ufw

# 3. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed!"
else
    echo "✅ Docker already installed."
fi

# 4. Configure Firewall (UFW)
echo "🛡️ Configuring Firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
echo "✅ Firewall active."

# 5. Create Project Directory
mkdir -p /opt/soletrade
cd /opt/soletrade

echo ""
echo "🎉 Server Environment Ready!"
echo "Next Steps:"
echo "1. Upload your code to /opt/soletrade (or git clone)"
echo "2. Run: ./scripts/setup-production-env.sh"
echo "3. Run: docker compose -f docker-compose.prod.yml up -d --build"
