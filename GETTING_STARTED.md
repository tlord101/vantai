# 🚀 Next Steps - Getting Started

## Quick Start (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

This will:
- ✅ Check Node.js version (requires 18+)
- ✅ Install Firebase CLI
- ✅ Install all dependencies
- ✅ Build functions
- ✅ Create environment templates
- ✅ Create Firestore security rules

### Option 2: Manual Setup

```bash
# Install dependencies
npm install
cd functions && npm install && cd ..

# Build functions
cd functions && npm run build && cd ..
```

---

## 🔐 Configure Environment Variables

### 1. Client Environment (`.env`)

Get Firebase config from [Firebase Console](https://console.firebase.google.com) > Project Settings:

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc...
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
VITE_FIREBASE_FUNCTIONS_URL=http://127.0.0.1:5001/yourproject/us-central1
```

### 2. Functions Environment (`functions/.env`)

Get API keys from respective dashboards:

```bash
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
GEMINI_API_KEY=AIzaSy...
```

**Where to get keys:**
- Paystack: [dashboard.paystack.com](https://dashboard.paystack.com) → Settings → API Keys
- Gemini: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

---

## 🔥 Deploy to Firebase

### 1. Login to Firebase

```bash
firebase login
```

### 2. Select Your Project

```bash
firebase use vantflowv1
```

### 3. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

**Key functions deployed:**
- `generateImage` - AI image generation
- `editImage` - AI image editing
- `paystackWebhook` - Payment webhooks
- `getPendingOverrides` - Admin: view edit requests
- `approveOverride` - Admin: approve/reject edits
- `getTransactions` - Admin: view billing
- `adjustCredits` - Admin: manage credits
- `getUsageMetrics` - Admin: analytics
- `getAdminAuditLogs` - Admin: view logs

### 5. Enable Google Cloud Vision API

```bash
gcloud services enable vision.googleapis.com --project=yourproject
```

---

## 👤 Set Admin User

After deploying functions, grant admin access to your account:

```bash
cd functions
npx ts-node src/setAdmin.ts your-email@example.com
```

**Important:** Sign out and back in for the admin claim to take effect.

---

## 🌐 Deploy Client

### Option A: Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at `https://yourproject.web.app`

### Option B: Vercel

```bash
npm install -g vercel
vercel --prod
```

### Option C: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

## 🔗 Configure Paystack Webhook

1. Go to [Paystack Dashboard](https://dashboard.paystack.com) → Settings → Webhooks
2. Add webhook URL: `https://us-central1-yourproject.cloudfunctions.net/paystackWebhook`
3. Copy webhook secret to `functions/.env`

---

## 🧪 Test Locally

### Start Development Server

```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Start dev server
npm run dev
```

Visit `http://localhost:5173`

### Test Scenarios

1. ✅ Register/login
2. ✅ Generate image (uses credits)
3. ✅ Edit image (face detection)
4. ✅ Purchase credits (Paystack test mode)
5. ✅ Access admin dashboard at `/admin`

---

## 📊 Monitor & Debug

### View Cloud Functions Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only generateImage

# Errors only
firebase functions:log | grep ERROR
```

### Check Firestore Data

Go to [Firebase Console](https://console.firebase.google.com) → Firestore Database

**Collections to check:**
- `/users` - User profiles
- `/billing` - Transaction history
- `/audit_logs` - System logs
- `/rate_limits` - Rate limit counters
- `/pending_overrides` - Edit approval requests

---

## ✅ Verify Everything Works

### Checklist

- [ ] Firebase project created and selected
- [ ] Environment variables configured
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed
- [ ] Google Cloud Vision API enabled
- [ ] Admin user created
- [ ] Client deployed
- [ ] Paystack webhook configured
- [ ] Test payment successful
- [ ] Admin dashboard accessible

### Test Commands

```bash
# Test image generation
curl -X POST https://us-central1-yourproject.cloudfunctions.net/generateImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a beautiful sunset","aspectRatio":"16:9"}'

# Test admin endpoint (requires admin claim)
curl https://us-central1-yourproject.cloudfunctions.net/v1/admin/usage-metrics \
  -H "Authorization: Bearer YOUR_ADMIN_ID_TOKEN"
```

---

## 🆘 Troubleshooting

### "Module not found" errors

```bash
# Reinstall dependencies
rm -rf node_modules functions/node_modules
npm install
cd functions && npm install
```

### Functions deployment fails

```bash
# Check Node.js version (must be 18+)
node --version

# Rebuild functions
cd functions
npm run build
```

### Admin claim not working

```bash
# Set claim again
cd functions
npx ts-node src/setAdmin.ts your-email@example.com

# User must sign out and back in
```

### Rate limit errors

```bash
# Check Firestore /rate_limits collection
# Reset manually if needed (admin only)
```

---

## 📚 Documentation

Comprehensive guides available:

- **[NEXT_STEPS.md](./NEXT_STEPS.md)** - This file
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment guide (650+ lines)
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Security best practices (550+ lines)
- **[ADMIN_IMPLEMENTATION_SUMMARY.md](./ADMIN_IMPLEMENTATION_SUMMARY.md)** - Admin features overview
- **[ADMIN_QUICKREF.md](./ADMIN_QUICKREF.md)** - Quick reference for admin APIs
- **[env.example](./env.example)** - Environment variable templates

---

## 🎯 What's Next?

After successful deployment:

1. **Test thoroughly** - Run through all user flows
2. **Monitor logs** - Watch for errors in first 24 hours
3. **Set up alerts** - Configure billing and error alerts
4. **Review security** - Follow [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)
5. **Optimize** - Adjust rate limits based on usage

---

## 💡 Pro Tips

### Local Development

```bash
# Use .env.development for local testing
VITE_FIREBASE_FUNCTIONS_URL=http://127.0.0.1:5001/yourproject/us-central1

# Use Paystack test keys
PAYSTACK_SECRET_KEY=sk_test_...
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
```

### Production

```bash
# Use production keys
PAYSTACK_SECRET_KEY=sk_live_...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...

# Update functions URL
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-yourproject.cloudfunctions.net
```

### CI/CD

Set up GitHub Actions for automatic deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
```

---

## 🎉 Success!

When everything is working, you'll see:

- ✅ Users can register and log in
- ✅ Image generation works
- ✅ Credits are consumed
- ✅ Payments process successfully
- ✅ Admin dashboard shows data
- ✅ Audit logs are created
- ✅ Rate limiting enforces
- ✅ No errors in logs

**You're ready to launch! 🚀**

---

## 📞 Need Help?

**Documentation:**
- Check the comprehensive guides in this repo
- Review Firebase documentation
- Check Paystack API reference

**Common Resources:**
- [Firebase Console](https://console.firebase.google.com)
- [Paystack Dashboard](https://dashboard.paystack.com)
- [Google AI Studio](https://makersuite.google.com)
- [Cloud Console](https://console.cloud.google.com)

---

**Last Updated:** November 23, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
