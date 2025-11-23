#!/bin/bash

# Quick Setup Script for VanTai AI
# This script helps set up the development environment

set -e  # Exit on error

echo "🚀 VanTai AI - Quick Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required. Current version: $(node --version)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js version OK: $(node --version)${NC}"
echo ""

# Check if Firebase CLI is installed
echo "🔥 Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Firebase CLI not found. Installing...${NC}"
  npm install -g firebase-tools
  echo -e "${GREEN}✅ Firebase CLI installed${NC}"
else
  echo -e "${GREEN}✅ Firebase CLI found: $(firebase --version)${NC}"
fi
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo -e "${GREEN}✅ Root dependencies installed${NC}"
echo ""

# Install functions dependencies
echo "📦 Installing functions dependencies..."
cd functions
npm install
echo -e "${GREEN}✅ Functions dependencies installed${NC}"
echo ""

# Build functions
echo "🔨 Building functions..."
npm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Functions built successfully${NC}"
else
  echo -e "${RED}❌ Functions build failed${NC}"
  exit 1
fi
cd ..
echo ""

# Check if .env files exist
echo "🔐 Checking environment files..."
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  Client .env not found${NC}"
  echo "   Creating from template..."
  cat > .env << 'EOF'
# Firebase Config (replace with your values)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Paystack Public Key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here

# Functions URL (local development)
VITE_FIREBASE_FUNCTIONS_URL=http://127.0.0.1:5001/yourproject/us-central1
EOF
  echo -e "${GREEN}✅ Created .env template - PLEASE UPDATE WITH YOUR VALUES${NC}"
else
  echo -e "${GREEN}✅ Client .env exists${NC}"
fi

if [ ! -f "functions/.env" ]; then
  echo -e "${YELLOW}⚠️  Functions .env not found${NC}"
  echo "   Creating from template..."
  cat > functions/.env << 'EOF'
# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
EOF
  echo -e "${GREEN}✅ Created functions/.env template - PLEASE UPDATE WITH YOUR VALUES${NC}"
else
  echo -e "${GREEN}✅ Functions .env exists${NC}"
fi
echo ""

# Check if firestore.rules exists
if [ ! -f "firestore.rules" ]; then
  echo -e "${YELLOW}⚠️  firestore.rules not found${NC}"
  echo "   Creating security rules..."
  cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }
    
    // Users
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId);
    }
    
    // Billing (server-side only)
    match /billing/{docId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow write: if false;
    }
    
    // Subscriptions (server-side only)
    match /subscriptions/{docId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow write: if false;
    }
    
    // Audit logs (admin only)
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if false;
    }
    
    match /audit_logs_image/{logId} {
      allow read: if isAdmin();
      allow write: if false;
    }
    
    match /audit_logs_policy/{logId} {
      allow read: if isAdmin();
      allow write: if false;
    }
    
    match /audit_logs_billing/{logId} {
      allow read: if isAdmin();
      allow write: if false;
    }
    
    match /audit_logs_admin/{logId} {
      allow read: if isAdmin();
      allow write: if false;
    }
    
    // Rate limits (server-side only)
    match /rate_limits/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if false;
    }
    
    // Pending overrides
    match /pending_overrides/{overrideId} {
      allow create: if isAuthenticated();
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow update, delete: if isAdmin();
    }
  }
}
EOF
  echo -e "${GREEN}✅ Created firestore.rules${NC}"
else
  echo -e "${GREEN}✅ firestore.rules exists${NC}"
fi
echo ""

# Summary
echo "=========================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update environment variables:"
echo "   - Edit .env with your Firebase config"
echo "   - Edit functions/.env with API keys"
echo ""
echo "2. Login to Firebase:"
echo "   ${YELLOW}firebase login${NC}"
echo ""
echo "3. Select your Firebase project:"
echo "   ${YELLOW}firebase use vantflowv1${NC}"
echo ""
echo "4. Deploy Firestore rules:"
echo "   ${YELLOW}firebase deploy --only firestore:rules${NC}"
echo ""
echo "5. Deploy Cloud Functions:"
echo "   ${YELLOW}cd functions && npm run build && firebase deploy --only functions${NC}"
echo ""
echo "6. Set admin user (after deployment):"
echo "   ${YELLOW}cd functions && npx ts-node src/setAdmin.ts your-email@example.com${NC}"
echo ""
echo "7. Build and deploy client:"
echo "   ${YELLOW}npm run build && firebase deploy --only hosting${NC}"
echo ""
echo "8. Start development server:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "📚 Documentation:"
echo "   - NEXT_STEPS.md - Detailed deployment guide"
echo "   - DEPLOYMENT_GUIDE.md - Complete deployment documentation"
echo "   - SECURITY_GUIDE.md - Security best practices"
echo "   - ADMIN_QUICKREF.md - Admin features quick reference"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"
