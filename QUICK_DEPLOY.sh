#!/bin/bash

# Quick Deploy Script for VanTai AI
# Automates the deployment process

set -e

echo "�� VanTai AI - Quick Deploy to Firebase"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if secret keys are configured
echo "🔐 Checking secret keys..."
if grep -q "your_actual_secret_key\|your_secret_key_here\|your_gemini_api_key" functions/.env 2>/dev/null; then
  echo -e "${RED}❌ Error: Secret keys not configured in functions/.env${NC}"
  echo ""
  echo "Please edit functions/.env and add:"
  echo "  - PAYSTACK_SECRET_KEY (from dashboard.paystack.com)"
  echo "  - PAYSTACK_WEBHOOK_SECRET (from dashboard.paystack.com)"
  echo "  - GEMINI_API_KEY (from makersuite.google.com)"
  echo ""
  exit 1
fi
echo -e "${GREEN}✅ Secret keys configured${NC}"
echo ""

# Select Firebase project
echo "🔥 Selecting Firebase project: vantflowv1"
firebase use vantflowv1
echo ""

# Deploy Firestore rules
echo "📋 Deploying Firestore security rules..."
firebase deploy --only firestore:rules
echo -e "${GREEN}✅ Firestore rules deployed${NC}"
echo ""

# Build functions
echo "🔨 Building Cloud Functions..."
cd functions
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Functions build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Functions built${NC}"
echo ""

# Deploy functions
echo "☁️  Deploying Cloud Functions..."
firebase deploy --only functions
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Functions deployment failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Functions deployed${NC}"
cd ..
echo ""

# Build client
echo "🔨 Building client..."
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Client build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Client built${NC}"
echo ""

# Deploy hosting
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Hosting deployment failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Hosting deployed${NC}"
echo ""

# Enable Cloud Vision API
echo "👁️  Enabling Google Cloud Vision API..."
gcloud services enable vision.googleapis.com --project=vantflowv1 2>/dev/null || echo -e "${YELLOW}⚠️  Run manually: gcloud services enable vision.googleapis.com --project=vantflowv1${NC}"
echo ""

# Summary
echo "========================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "🌐 Your app is live at:"
echo -e "   ${BLUE}https://vantflowv1.web.app${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Set admin user:"
echo -e "   ${YELLOW}cd functions && npx ts-node src/setAdmin.ts your-email@example.com${NC}"
echo ""
echo "2. Configure Paystack webhook:"
echo "   Go to: https://dashboard.paystack.com/#/settings/developer"
echo "   Add webhook URL: https://us-central1-vantflowv1.cloudfunctions.net/paystackWebhook"
echo ""
echo "3. Test your app:"
echo "   - Register/login"
echo "   - Generate an image"
echo "   - Purchase credits"
echo "   - Access /admin dashboard"
echo ""
echo "4. Monitor logs:"
echo -e "   ${YELLOW}firebase functions:log${NC}"
echo ""
echo -e "${GREEN}🎉 Enjoy your deployed app!${NC}"
