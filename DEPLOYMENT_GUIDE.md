# Deployment Guide

## Overview

This guide covers deploying the VanTai AI platform to production, including Firebase Cloud Functions, Firestore, and the React client.

## 🚀 Prerequisites

### Required Accounts

1. **Firebase Project**
   - Create at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Blaze (pay-as-you-go) plan for Cloud Functions
   - Enable Authentication, Firestore, Storage

2. **Paystack Account**
   - Sign up at [paystack.com](https://paystack.com)
   - Complete business verification
   - Get API keys from Settings > API Keys & Webhooks

3. **Google AI Studio**
   - Access at [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Generate Gemini API key

4. **Google Cloud Platform**
   - Enable Cloud Vision API in your Firebase project's GCP console
   - Enable billing

### Required Tools

```bash
# Node.js 18+
node --version  # v18.0.0 or higher

# Firebase CLI
npm install -g firebase-tools
firebase --version  # 13.0.0 or higher

# Git
git --version
```

## 📦 Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/vantai.git
cd vantai
```

### 2. Install Dependencies

```bash
# Root dependencies
npm install

# Functions dependencies
cd functions
npm install
cd ..
```

### 3. Firebase Configuration

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting (optional)
# - Storage

# Choose existing project or create new
```

### 4. Environment Variables

#### Functions Environment

Create `/functions/.env`:

```bash
# Paystack
PAYSTACK_SECRET_KEY=sk_live_YOUR_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Gemini AI
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Set Firebase Functions config:**

```bash
cd functions

# Set Paystack keys
firebase functions:config:set \
  paystack.secret_key="sk_live_YOUR_SECRET_KEY" \
  paystack.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"

# Set Gemini API key
firebase functions:config:set \
  gemini.api_key="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# View config
firebase functions:config:get
```

#### Client Environment

Create `/.env`:

```bash
# Firebase Config
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Paystack Public Key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY

# API Endpoints
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-yourproject.cloudfunctions.net
```

**Get Firebase config:**
1. Go to Firebase Console > Project Settings
2. Scroll to "Your apps" section
3. Copy config object values

## 🗄️ Database Setup

### Firestore Indexes

Deploy indexes for query performance:

```bash
firebase deploy --only firestore:indexes
```

**Required indexes** (auto-created on first query, or add to `firestore.indexes.json`):

```json
{
  "indexes": [
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "eventType", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "billing",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "pending_overrides",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "requestedAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

### Firestore Security Rules

Deploy security rules:

```bash
firebase deploy --only firestore:rules
```

**Production rules** (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId);
    }
    
    // Billing collection (server-side only)
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
```

## ☁️ Cloud Functions Deployment

### Build and Deploy

```bash
cd functions

# Build TypeScript
npm run build

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:generateImage
```

### Environment-Specific Deployment

**Staging:**
```bash
# Use staging project
firebase use staging

# Deploy functions
firebase deploy --only functions
```

**Production:**
```bash
# Use production project
firebase use production

# Deploy with force flag (for critical updates)
firebase deploy --only functions --force
```

### Verify Deployment

```bash
# Check function logs
firebase functions:log

# Test endpoint
curl -X POST \
  https://us-central1-yourproject.cloudfunctions.net/generateImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "aspectRatio": "1:1"}'
```

## 🌐 Client Deployment

### Build Client

```bash
# Development build
npm run build

# Production build with optimization
npm run build -- --mode production
```

### Deploy to Firebase Hosting

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Preview before deploy
firebase hosting:channel:deploy preview

# Visit: https://yourproject--preview-xxx.web.app
```

### Deploy to Vercel (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

**Vercel environment variables:**
- Add all `VITE_*` variables in Vercel dashboard
- Settings > Environment Variables

### Deploy to Netlify (Alternative)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

**Build settings:**
- Build command: `npm run build`
- Publish directory: `dist`

## 🔧 Post-Deployment Configuration

### 1. Set Admin Custom Claims

Create admin users via Firebase Admin SDK:

```typescript
// admin-setup.ts (run locally, not deployed)
import * as admin from "firebase-admin";
import * as serviceAccount from "./serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

async function setAdminClaim(email: string) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`Admin claim set for ${email}`);
}

setAdminClaim("admin@example.com");
```

Run:
```bash
npx ts-node admin-setup.ts
```

### 2. Configure Paystack Webhook

1. Go to Paystack Dashboard > Settings > Webhooks
2. Add webhook URL: `https://us-central1-yourproject.cloudfunctions.net/paystackWebhook`
3. Copy webhook secret to functions config

### 3. Enable Google Cloud Vision API

```bash
# Enable API
gcloud services enable vision.googleapis.com --project=yourproject

# Verify
gcloud services list --enabled --project=yourproject | grep vision
```

### 4. Set up Scheduled Functions (Optional)

For audit log cleanup and rate limit maintenance:

**Add to `/functions/src/index.ts`:**
```typescript
import {cleanupOldAuditLogs} from "./auditLogging";
import {cleanupExpiredRateLimits} from "./rateLimiting";

// Run daily at 2 AM
export const dailyCleanup = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("Africa/Lagos")
  .onRun(async () => {
    await cleanupOldAuditLogs();
    await cleanupExpiredRateLimits();
  });
```

Deploy:
```bash
firebase deploy --only functions:dailyCleanup
```

## 📊 Monitoring & Alerts

### Firebase Console

**Metrics to monitor:**
- Cloud Functions invocations/errors
- Firestore read/write operations
- Authentication sign-ins
- Storage usage

### Set up Alerts

**Email alerts for errors:**
1. Go to Cloud Console > Monitoring > Alerting
2. Create alert policy
3. Metric: Cloud Function error rate
4. Threshold: > 1% error rate
5. Notification: Email

**Billing alerts:**
1. Cloud Console > Billing > Budgets & Alerts
2. Set monthly budget
3. Threshold: 50%, 90%, 100%
4. Notification: Email

### Log Aggregation

**View Cloud Functions logs:**
```bash
# Tail logs
firebase functions:log --only generateImage

# View errors only
firebase functions:log --only generateImage | grep ERROR
```

**Export logs to BigQuery:**
1. Cloud Console > Logging > Log Router
2. Create sink
3. Destination: BigQuery dataset
4. Filter: `resource.type="cloud_function"`

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          cd functions && npm ci
      
      - name: Build functions
        run: cd functions && npm run build
      
      - name: Build client
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_PAYSTACK_PUBLIC_KEY: ${{ secrets.VITE_PAYSTACK_PUBLIC_KEY }}
          VITE_FIREBASE_FUNCTIONS_URL: ${{ secrets.VITE_FIREBASE_FUNCTIONS_URL }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: yourproject
```

**Setup secrets in GitHub:**
1. Repository > Settings > Secrets and variables > Actions
2. Add all `VITE_*` variables
3. Add `FIREBASE_SERVICE_ACCOUNT` JSON

## 🆘 Troubleshooting

### Common Issues

**Functions deployment fails:**
```bash
# Clear functions cache
firebase functions:delete --force FUNCTION_NAME

# Redeploy
firebase deploy --only functions:FUNCTION_NAME
```

**Environment variables not loading:**
```bash
# Check config
firebase functions:config:get

# Re-download for local emulation
firebase functions:config:get > .runtimeconfig.json
```

**CORS errors:**
- Check `Access-Control-Allow-Origin` headers in functions
- Verify client `VITE_FIREBASE_FUNCTIONS_URL` matches deployed URL

**Firestore permission denied:**
- Check security rules deployment: `firebase deploy --only firestore:rules`
- Verify user authentication state
- Check custom claims for admin routes

**Rate limit not working:**
- Verify Firestore indexes deployed
- Check `/rate_limits` collection exists
- Review audit logs for rate limit events

## 📋 Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing (`npm test`)
- [ ] Functions build successful (`npm run build`)
- [ ] Environment variables set
- [ ] Security rules reviewed
- [ ] API keys rotated from dev to prod
- [ ] Firestore indexes created

**Deployment:**
- [ ] Functions deployed
- [ ] Client deployed
- [ ] Security rules deployed
- [ ] Indexes deployed
- [ ] Webhook configured

**Post-deployment:**
- [ ] Test payment flow end-to-end
- [ ] Test image generation
- [ ] Test admin dashboard
- [ ] Verify audit logging
- [ ] Check monitoring dashboards
- [ ] Set up alerts

**Weekly:**
- [ ] Review error logs
- [ ] Check billing usage
- [ ] Review audit logs
- [ ] Monitor performance metrics

---

## 📚 Related Documentation

- [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) - Security best practices
- [PAYSTACK_IMPLEMENTATION.md](./PAYSTACK_IMPLEMENTATION.md) - Payment setup
- [Firebase Documentation](https://firebase.google.com/docs)
