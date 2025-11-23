# Next Steps - Deployment Checklist

## 🎯 Immediate Actions

### 1. Set Up Environment Variables

**Functions environment** (create `/functions/.env`):
```bash
cd /workspaces/vantai/functions
cat > .env << 'EOF'
# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_test_key_here
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
EOF
```

**Client environment** (create `/.env`):
```bash
cd /workspaces/vantai
cat > .env << 'EOF'
# Firebase Config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here

# Functions URL
VITE_FIREBASE_FUNCTIONS_URL=http://127.0.0.1:5001/yourproject/us-central1
EOF
```

### 2. Install Missing Dependencies

```bash
cd /workspaces/vantai

# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install

# Install additional types if needed
npm install --save-dev @types/node
```

### 3. Build Functions

```bash
cd /workspaces/vantai/functions
npm run build
```

### 4. Set Up Firebase

```bash
cd /workspaces/vantai

# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init

# Select your project
firebase use your-project-id
```

### 5. Deploy Firestore Security Rules

Create `/firestore.rules`:
```bash
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
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 6. Deploy Cloud Functions

```bash
cd /workspaces/vantai/functions

# Build
npm run build

# Deploy
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:generateImage,functions:editImage
```

### 7. Create Admin User

After deploying functions, set admin claim for your user:

```bash
cd /workspaces/vantai/functions

# Run the setAdmin script
npx ts-node src/setAdmin.ts your-email@example.com
```

**Important:** The user must sign out and back in for the admin claim to take effect.

### 8. Build and Deploy Client

```bash
cd /workspaces/vantai

# Build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# OR deploy to Vercel
npm install -g vercel
vercel --prod
```

### 9. Configure Paystack Webhook

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to Settings > Webhooks
3. Add webhook URL:
   ```
   https://us-central1-yourproject.cloudfunctions.net/paystackWebhook
   ```
4. Copy webhook secret and update environment variables

### 10. Enable Google Cloud Vision API

```bash
# Enable Vision API for your project
gcloud services enable vision.googleapis.com --project=yourproject

# Verify it's enabled
gcloud services list --enabled --project=yourproject | grep vision
```

---

## 🧪 Testing Checklist

### Test Locally First

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start dev server
npm run dev
```

**Test scenarios:**
1. ✅ User registration and login
2. ✅ Image generation (should consume credits)
3. ✅ Image editing with face detection
4. ✅ Payment flow (use Paystack test cards)
5. ✅ Admin dashboard access (after setting claim)
6. ✅ Rate limiting (make 15+ rapid requests)
7. ✅ Audit log creation

### Test in Production

1. ✅ End-to-end payment flow with real Paystack test mode
2. ✅ Webhook delivery from Paystack
3. ✅ Admin dashboard functionality
4. ✅ Audit logs appearing in Firestore
5. ✅ Rate limits working across function instances

---

## 📊 Monitoring Setup

### Cloud Functions Monitoring

```bash
# View real-time logs
firebase functions:log

# View specific function logs
firebase functions:log --only generateImage

# Check for errors
firebase functions:log | grep ERROR
```

### Set Up Alerts

1. Go to [Cloud Console](https://console.cloud.google.com)
2. Navigate to Monitoring > Alerting
3. Create alerts for:
   - Function error rate > 1%
   - Function execution time > 30s
   - Billing exceeds budget

---

## 🔐 Security Hardening

### Pre-Production Checklist

- [ ] Rotate all API keys from dev to production
- [ ] Set up CORS properly in functions
- [ ] Enable Cloud Functions VPC (optional, for network isolation)
- [ ] Set up Cloud Armor for DDoS protection (optional)
- [ ] Configure Firestore backups
- [ ] Set up billing alerts
- [ ] Review security rules one more time
- [ ] Test rate limiting thoroughly
- [ ] Verify webhook signature validation
- [ ] Test admin access controls

---

## 📈 Post-Deployment

### Week 1

- [ ] Monitor error rates daily
- [ ] Check audit logs for anomalies
- [ ] Verify webhook deliveries
- [ ] Test payment flows
- [ ] Monitor Firestore usage

### Week 2-4

- [ ] Review user feedback
- [ ] Analyze usage metrics
- [ ] Optimize rate limits based on actual usage
- [ ] Tune audit log retention
- [ ] Plan for scaling if needed

### Monthly

- [ ] Review audit logs for security issues
- [ ] Check for dependency vulnerabilities (`npm audit`)
- [ ] Rotate API keys
- [ ] Review and optimize Firestore indexes
- [ ] Check billing and optimize costs

---

## 🆘 Troubleshooting

### Common Issues

**"Admin privileges required"**
- Run `npx ts-node src/setAdmin.ts your-email@example.com`
- User must sign out and back in

**Functions deployment fails**
- Check Node.js version (must be 18+)
- Run `npm run build` in /functions first
- Check Firebase project is selected: `firebase use`

**Rate limit not working**
- Verify Firestore indexes are created
- Check security rules allow server writes
- Review function logs for errors

**Webhook signature fails**
- Verify `PAYSTACK_WEBHOOK_SECRET` matches dashboard
- Check webhook URL in Paystack settings
- Review function logs for signature comparison

---

## 📞 Quick Commands Reference

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy only firestore rules
firebase deploy --only firestore:rules

# View logs
firebase functions:log

# Set admin user
cd functions && npx ts-node src/setAdmin.ts email@example.com

# Build functions
cd functions && npm run build

# Build client
npm run build

# Start dev server
npm run dev

# Start emulators
firebase emulators:start
```

---

## ✅ You're Ready When...

- [ ] Environment variables configured
- [ ] Functions deployed successfully
- [ ] Firestore rules deployed
- [ ] Admin user created and tested
- [ ] Client deployed
- [ ] Paystack webhook configured
- [ ] Test payment completed successfully
- [ ] Admin dashboard accessible
- [ ] Audit logs appearing in Firestore
- [ ] Rate limiting tested

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Users can register and log in
2. ✅ Image generation works and consumes credits
3. ✅ Payments process successfully
4. ✅ Credits are added after payment
5. ✅ Webhooks are received and processed
6. ✅ Admin can access `/admin` dashboard
7. ✅ Audit logs are being created
8. ✅ Rate limits enforce properly
9. ✅ Face detection blocks inappropriate edits
10. ✅ No errors in Cloud Functions logs

---

**🚀 Ready to deploy? Start with step 1 above!**
