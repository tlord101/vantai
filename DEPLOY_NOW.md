# 🚀 Ready to Deploy - VanTai AI

## ✅ Configuration Complete!

Your Firebase and Paystack credentials have been configured:

### Firebase Project
- **Project ID:** `vantflowv1`
- **Region:** `us-central1`
- **Auth Domain:** `vantflowv1.firebaseapp.com`
- **Database:** Realtime Database enabled
- **Storage:** `vantflowv1.firebasestorage.app`

### Paystack
- **Public Key:** ✅ Configured (LIVE mode)
- **Secret Key:** ⚠️ **REQUIRED** - Add to `functions/.env`
- **Webhook Secret:** ⚠️ **REQUIRED** - Add to `functions/.env`

---

## 🔑 Next: Add Secret Keys

You need to add **server-side secrets** to `functions/.env`:

```bash
# Edit functions/.env
nano functions/.env
```

Add your keys:
```bash
PAYSTACK_SECRET_KEY=sk_live_your_actual_secret_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
GEMINI_API_KEY=your_actual_gemini_api_key
```

**Where to get them:**
1. **Paystack Secret Key & Webhook Secret:** 
   - Go to [dashboard.paystack.com/#/settings/developer](https://dashboard.paystack.com/#/settings/developer)
   - Copy "Secret Key" (starts with `sk_live_`)
   - Copy "Webhook Secret" (starts with `whsec_`)

2. **Gemini API Key:**
   - Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Create API key
   - Copy key (starts with `AIzaSy`)

---

## 🚀 Deploy Now (3 Commands)

After adding secret keys to `functions/.env`:

### 1. Select Firebase Project
```bash
firebase use vantflowv1
```

### 2. Deploy Everything
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Build and deploy functions
cd functions && npm run build && firebase deploy --only functions && cd ..

# Build and deploy client
npm run build && firebase deploy --only hosting
```

### 3. Enable Cloud Vision API
```bash
gcloud services enable vision.googleapis.com --project=vantflowv1
```

---

## 👤 Set Admin User

After deploying functions:

```bash
cd functions
npx ts-node src/setAdmin.ts your-email@example.com
```

Replace `your-email@example.com` with your actual email address.

**Important:** Sign out and back in for admin privileges to take effect.

---

## 🔗 Configure Paystack Webhook

After deploying functions:

1. Go to [Paystack Dashboard → Settings → Webhooks](https://dashboard.paystack.com/#/settings/developer)
2. Add webhook URL:
   ```
   https://us-central1-vantflowv1.cloudfunctions.net/paystackWebhook
   ```
3. Save changes

---

## ✅ Verify Deployment

Your app will be live at:
- **Production URL:** `https://vantflowv1.web.app`
- **Functions URL:** `https://us-central1-vantflowv1.cloudfunctions.net`

### Test Checklist
- [ ] Can register/login
- [ ] Can generate images (consumes credits)
- [ ] Can purchase credits (payment works)
- [ ] Can access `/admin` dashboard (after setting admin claim)
- [ ] Audit logs appear in Firestore
- [ ] Rate limiting works (try 15+ rapid requests)

---

## 📊 Monitor Your App

### View Logs
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only generateImage
```

### Check Firestore
Go to [Firebase Console](https://console.firebase.google.com/project/vantflowv1/firestore)

Collections to check:
- `/users` - User profiles
- `/billing` - Transactions
- `/audit_logs` - System logs
- `/rate_limits` - Rate counters

---

## 🎯 Quick Actions

**If you have all secrets ready:**
```bash
# One-command deployment
firebase use vantflowv1 && \
firebase deploy --only firestore:rules && \
cd functions && npm run build && firebase deploy --only functions && cd .. && \
npm run build && firebase deploy --only hosting && \
gcloud services enable vision.googleapis.com --project=vantflowv1
```

**Set yourself as admin:**
```bash
cd functions && npx ts-node src/setAdmin.ts your-email@example.com
```

---

## ⚠️ Important Notes

1. **LIVE Mode:** You're using Paystack LIVE keys - real transactions will be processed
2. **Secret Keys:** Never commit `functions/.env` to git (it's in `.gitignore`)
3. **Admin Access:** Only set admin claim for trusted users
4. **Monitoring:** Watch logs closely in first 24 hours after deployment

---

## 📚 Full Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Detailed setup guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment docs
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Security best practices
- **[ADMIN_QUICKREF.md](./ADMIN_QUICKREF.md)** - Admin API reference

---

## ✅ Status

**Configured:**
- ✅ Firebase project (vantflowv1)
- ✅ Client environment variables
- ✅ Paystack public key (LIVE)
- ✅ Firestore security rules ready
- ✅ All code compiled and ready

**Pending:**
- ⚠️ Add Paystack secret key to `functions/.env`
- ⚠️ Add Paystack webhook secret to `functions/.env`
- ⚠️ Add Gemini API key to `functions/.env`
- ⚠️ Deploy to Firebase
- ⚠️ Enable Cloud Vision API
- ⚠️ Set admin user
- ⚠️ Configure webhook in Paystack

---

**🎉 You're ready! Add the secret keys and deploy!**
