# Paystack Integration - Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Get Paystack Keys
```bash
# Go to: https://dashboard.paystack.com/#/settings/developers
# Copy: Secret Key (sk_test_xxx) and Webhook Secret
```

### 2. Set Environment Variables
```bash
cd functions
firebase functions:secrets:set PAYSTACK_SECRET_KEY
# Paste: sk_test_xxxxxxxxxxxxx

firebase functions:secrets:set PAYSTACK_WEBHOOK_SECRET
# Paste: whsec_xxxxxxxxxxxxx
```

### 3. Deploy Functions
```bash
cd /workspaces/vantai
firebase deploy --only functions
```

### 4. Configure Webhook
```
URL: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/paystackWebhook
Events: ✅ charge.success, subscription.create, subscription.disable
```

### 5. Test Purchase
```javascript
// Use test card: 4084 0840 8408 4081
// CVV: 408, PIN: 0000
```

## 📡 API Endpoints

### Create Subscription/Purchase
```bash
POST /v1/create-subscription
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "planId": "pro",      # starter | pro | premium
  "type": "subscription" # or "checkout" for one-time
}

# Response:
{
  "authorizationUrl": "https://checkout.paystack.com/xxxxx"
}
```

### Webhook Handler (Paystack calls this)
```bash
POST /v1/paystack-webhook
X-Paystack-Signature: <hmac-sha512-signature>

# Processes: charge.success, subscription.create, subscription.disable
```

### Reconcile Missed Webhooks (Admin)
```bash
POST /v1/reconcile-webhooks
Authorization: Bearer <admin-firebase-token>

# Fetches last 100 Paystack transactions
# Compares with Firestore
# Processes missing ones
```

## 💳 Credit Costs

| Action | Credits | Cost (₦10/credit) |
|--------|---------|-------------------|
| Image Generation | 5 | ₦50 |
| Image Edit | 3 | ₦30 |
| Admin | 0 | Free |

## 📦 Credit Packages

| Package | Credits | Price | Per Credit |
|---------|---------|-------|------------|
| Starter | 50 | ₦500 | ₦10.00 |
| Pro | 150 | ₦1,200 | ₦8.00 |
| Premium | 500 | ₦3,500 | ₦7.00 |

## 🔍 Check Credit Balance

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from './lib/firebase';

const userDoc = await getDoc(doc(firestore, 'users', userId));
const credits = userDoc.data()?.credits ?? 0;
```

## 🔒 Admin User Setup

```bash
# Give user unlimited credits
firebase auth:users:set-claims user@example.com admin=true
```

## 🐛 Troubleshooting

### Credits not updating?
```bash
# Check function logs
firebase functions:log --only paystackWebhook

# Verify webhook signature in Paystack dashboard
# Check Firestore security rules allow function writes
```

### Webhook not receiving?
```bash
# Test webhook manually
curl -X POST YOUR_WEBHOOK_URL \
  -H "X-Paystack-Signature: test" \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{"reference":"test"}}'

# Check: Cloud Function deployed? Correct URL? Events selected?
```

### Payment fails?
```bash
# Test mode: Use test cards (4084 0840 8408 4081)
# Live mode: Verify Paystack account activated
# Check: Using sk_live_xxx for production
```

## 📊 Monitor Transactions

### Firestore Console
```
/users/{uid}              → credits balance
/billing                  → all transactions
/subscriptions/{uid}      → active subscriptions
```

### Paystack Dashboard
```
Transactions → View all payments
Webhooks → Check delivery logs
Customers → See customer list
```

## 🧪 Test Cards

| Purpose | Card | CVV | PIN |
|---------|------|-----|-----|
| Success | 4084 0840 8408 4081 | 408 | 0000 |
| Declined | 5060 6666 6666 6666 | 123 | 1234 |
| Timeout | 5078 5078 5078 5078 12 | 884 | 0000 |

## 🔄 Webhook Events

### charge.success
```json
{
  "event": "charge.success",
  "data": {
    "reference": "T123456789",
    "amount": 50000,  // kobo (₦500)
    "status": "success",
    "metadata": {
      "planId": "starter",
      "credits": 50
    }
  }
}
```
**Action:** Allocates credits to user

### subscription.create
```json
{
  "event": "subscription.create",
  "data": {
    "subscription_code": "SUB_xxxxx",
    "plan": { "name": "Pro" },
    "customer": { "email": "user@example.com" }
  }
}
```
**Action:** Creates subscription record

### subscription.disable
```json
{
  "event": "subscription.disable",
  "data": {
    "subscription_code": "SUB_xxxxx"
  }
}
```
**Action:** Marks subscription inactive

## 📝 Client Integration

### BillingPage Route
```typescript
// In App.tsx or router config
<Route path="/billing" element={<BillingPage />} />
```

### Handle 402 Error
```typescript
const response = await generateImage(prompt);

if (response.status === 402) {
  const data = await response.json();
  // Show modal: "Insufficient credits"
  // Button: "Buy Credits" → navigate('/billing')
}
```

### Real-time Balance
```typescript
import { doc, onSnapshot } from 'firebase/firestore';

onSnapshot(doc(db, 'users', userId), (snapshot) => {
  const credits = snapshot.data()?.credits ?? 0;
  setCredits(credits);
});
```

## 🎯 Production Checklist

- [ ] Switch to live keys: `sk_live_xxx`
- [ ] Update webhook URL to production
- [ ] Set `PAYSTACK_SECRET_KEY` secret
- [ ] Set `PAYSTACK_WEBHOOK_SECRET` secret
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Test with real card (small amount)
- [ ] Verify webhook delivery in dashboard
- [ ] Check Firestore credit allocation
- [ ] Monitor logs: `firebase functions:log`

## 💡 Pro Tips

1. **Test webhooks locally:** Use ngrok to expose localhost
2. **Monitor credits:** Set up Cloud Monitoring alerts
3. **Reconcile daily:** Run reconciliation function via cron
4. **Log everything:** Paystack + Firestore = full audit trail
5. **Handle failures:** Webhook retries automatically (24h window)

## 📚 Documentation Links

- [Paystack API Docs](https://paystack.com/docs/api)
- [Webhook Guide](https://paystack.com/docs/payments/webhooks)
- [Test Cards](https://paystack.com/docs/payments/test-payments)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Implementation Details](./PAYSTACK_IMPLEMENTATION.md)
- [Full Setup Guide](./PAYSTACK_SETUP.md)

---

**Need Help?** Check Cloud Function logs → Paystack Dashboard → Firestore Console
