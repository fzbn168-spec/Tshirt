#!/bin/bash

# Production Environment Setup Script
# Usage: ./setup-production-env.sh

echo "==============================================="
echo "   SoleTrade Production Configuration Wizard   "
echo "==============================================="
echo ""

# 1. Ask for Stripe Keys
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
