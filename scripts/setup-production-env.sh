#!/bin/bash

# Production Environment Setup Script
# Usage: ./setup-production-env.sh

echo "==============================================="
echo "   SoleTrade Production Configuration Wizard   "
echo "==============================================="
echo ""

# 0. Load existing .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 1. Ask for Domain & Email (for SSL)
if [ -z "$DOMAIN_NAME" ]; then
  read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
fi
if [ -z "$EMAIL" ]; then
  read -p "Enter your email for SSL certificates: " EMAIL
fi

# 1.1 Generate JWT Secret
if [ -z "$JWT_SECRET" ]; then
  if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 32)
  else
    JWT_SECRET="secret_$(date +%s)"
  fi
fi

# 1.2 Ask for SMTP
echo ""
echo "Configure SMTP (Optional, press Enter to skip)"
[ -z "$SMTP_HOST" ] && read -p "SMTP Host: " SMTP_HOST
[ -z "$SMTP_PORT" ] && read -p "SMTP Port: " SMTP_PORT
[ -z "$SMTP_USER" ] && read -p "SMTP User: " SMTP_USER
[ -z "$SMTP_PASS" ] && read -p "SMTP Password: " SMTP_PASS

# Save to root .env
echo "DOMAIN_NAME=$DOMAIN_NAME" > .env
echo "EMAIL=$EMAIL" >> .env
echo "COMPOSE_PROJECT_NAME=soletrade" >> .env
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "SMTP_HOST=$SMTP_HOST" >> .env
echo "SMTP_PORT=$SMTP_PORT" >> .env
echo "SMTP_USER=$SMTP_USER" >> .env
echo "SMTP_PASS=$SMTP_PASS" >> .env

# 2. Ask for Stripe Keys
echo ""
echo "Please enter your Stripe LIVE keys (from Dashboard > Developers > API keys):"
read -p "Stripe Secret Key (sk_live_...): " STRIPE_SECRET_KEY
read -p "Stripe Publishable Key (pk_live_...): " STRIPE_PUBLISHABLE_KEY
read -p "Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET

if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "Error: Keys cannot be empty."
  exit 1
fi

# 2. Update Backend .env (or create it)
BACKEND_ENV="backend/.env"
echo ""
echo "Updating $BACKEND_ENV..."

# Append or update lines
if grep -q "STRIPE_SECRET_KEY=" "$BACKEND_ENV"; then
  # Use sed to replace (simplified for demo, usually .env management is tricky with sed across platforms)
  # For safety, we will just append a new block at the end, as last definition usually wins in dotenv,
  # OR we advise user to check it.
  echo "Warning: STRIPE_SECRET_KEY already exists in .env. Please check manually or use a fresh .env."
else
  echo "" >> "$BACKEND_ENV"
  echo "# Stripe Production Keys" >> "$BACKEND_ENV"
  echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" >> "$BACKEND_ENV"
  echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET" >> "$BACKEND_ENV"
fi

# 3. Update Frontend .env (NEXT_PUBLIC_)
FRONTEND_ENV="frontend/.env.local"
if [ ! -f "$FRONTEND_ENV" ]; then
    touch "$FRONTEND_ENV"
fi

echo "Updating $FRONTEND_ENV..."
echo "" >> "$FRONTEND_ENV"
echo "# Stripe Production Keys" >> "$FRONTEND_ENV"
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY" >> "$FRONTEND_ENV"

echo ""
echo "✅ Configuration Saved!"
echo "   - Backend: $BACKEND_ENV updated."
echo "   - Frontend: $FRONTEND_ENV updated."
echo ""
echo "⚠️  IMPORTANT: You must REBUILD your Docker containers for changes to take effect!"
echo "   Run: docker-compose up -d --build"
