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
read -p "Enter your domain name [${DOMAIN_NAME}]: " input
DOMAIN_NAME="${input:-$DOMAIN_NAME}"

read -p "Enter your email for SSL certificates [${EMAIL}]: " input
EMAIL="${input:-$EMAIL}"

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
echo "Configure SMTP (Optional, press Enter to keep current value or skip)"
read -p "SMTP Host [${SMTP_HOST}]: " input
SMTP_HOST="${input:-$SMTP_HOST}"

read -p "SMTP Port [${SMTP_PORT}]: " input
SMTP_PORT="${input:-$SMTP_PORT}"

read -p "SMTP User [${SMTP_USER}]: " input
SMTP_USER="${input:-$SMTP_USER}"

read -p "SMTP Password [${SMTP_PASS}]: " input
SMTP_PASS="${input:-$SMTP_PASS}"

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

# Mask secrets for display
MASKED_SECRET="${STRIPE_SECRET_KEY:0:7}..."
MASKED_PUB="${STRIPE_PUBLISHABLE_KEY:0:7}..."
MASKED_WEBHOOK="${STRIPE_WEBHOOK_SECRET:0:7}..."

read -p "Stripe Secret Key [${MASKED_SECRET}]: " input
if [ ! -z "$input" ]; then STRIPE_SECRET_KEY="$input"; fi

read -p "Stripe Publishable Key [${MASKED_PUB}]: " input
if [ ! -z "$input" ]; then STRIPE_PUBLISHABLE_KEY="$input"; fi

read -p "Stripe Webhook Secret [${MASKED_WEBHOOK}]: " input
if [ ! -z "$input" ]; then STRIPE_WEBHOOK_SECRET="$input"; fi

if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "Error: Keys cannot be empty."
  exit 1
fi

echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" >> .env
echo "STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY" >> .env
echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET" >> .env

echo ""
echo "✅ Configuration Saved to .env!"
echo ""
echo "⚠️  IMPORTANT: You must REBUILD your Docker containers for changes to take effect!"
echo "   Run: docker-compose up -d --build"
