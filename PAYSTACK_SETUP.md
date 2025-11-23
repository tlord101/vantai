# Paystack Integration Setup Guide

Complete guide for setting up Paystack payment integration with Firebase Cloud Functions.

## 📋 Prerequisites

- Paystack account ([signup](https://paystack.com))
- Firebase project with Blaze (pay-as-you-go) plan
- Node.js 18+ and npm installed
- Firebase CLI installed: `npm install -g firebase-tools`

## 🔑 Environment Variables

### Firebase Cloud Functions (.env in /functions)

Create `/functions/.env.local` for local development:

```bash
# Paystack API Keys (from Paystack Dashboard > Settings > API Keys & Webhooks)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx  # Test mode
# PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx  # Production mode

# Webhook Secret (from Paystack Dashboard > Settings > API Keys & Webhooks)
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Google Cloud Vision API (for face detection)
# Auto-detected from Firebase project, or set manually:
# GOOGLE_CLOUD_PROJECT=your-firebase-project-id
```

### Client Application (.env in root)

Create `.env.local` for local development:

```bash
# Firebase Configuration (from Firebase Console > Project Settings)
VITE_FIREBASE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Firebase Cloud Functions URL
VITE_FIREBASE_FUNCTIONS_URL=http://localhost:5001/your-project-id/us-central1  # Local
# VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-your-project-id.cloudfunctions.net  # Production
```

## 🚀 Deployment Steps

### 1. Install Dependencies

```bash
# Install client dependencies
npm install

# Install function dependencies
cd functions
npm install axios
cd ..
```

### 2. Configure Firebase Functions Secrets

For production, use Firebase Functions secrets (more secure than .env):

```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY
# Enter your Paystack secret key when prompted

firebase functions:secrets:set PAYSTACK_WEBHOOK_SECRET
# Enter your webhook secret when prompted
```

### 3. Enable Required Google Cloud APIs

```bash
# Enable Cloud Vision API (for face detection)
gcloud services enable vision.googleapis.com --project=your-project-id

# Enable Gemini API
gcloud services enable generativelanguage.googleapis.com --project=your-project-id
```

### 4. Update Firestore Security Rules

Add billing and subscription collections to `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Billing collection (read-only for users)
    match /billing/{transactionId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Subscriptions collection (read-only for users)
    match /subscriptions/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

### 5. Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createSubscription,functions:paystackWebhook
```

### 6. Configure Paystack Webhook

1. Go to Paystack Dashboard > Settings > API Keys & Webhooks
2. Click "Add Webhook URL"
3. Enter your webhook URL:
   ```
   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/paystackWebhook
   ```
4. Select events to listen to:
   - ✅ charge.success
   - ✅ subscription.create
   - ✅ subscription.disable
5. Save webhook configuration

### 7. Test the Integration

#### Local Testing (Emulator)

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, test webhook locally using ngrok
ngrok http 5001

# Update Paystack webhook URL to ngrok URL:
# https://YOUR_NGROK_ID.ngrok.io/YOUR_PROJECT_ID/us-central1/paystackWebhook
```

#### Production Testing

1. Make a test purchase using Paystack test cards:
   - **Successful payment**: `4084 0840 8408 4081` CVV: `408` PIN: `0000`
   - **Insufficient funds**: `5060 6666 6666 6666` CVV: `123` PIN: `1234`

2. Check Firebase Console > Firestore to verify:
   - `/users/{uid}` has updated `credits` field
   - `/billing/{txId}` has transaction record
   - `/subscriptions/{uid}` has subscription data (if applicable)

## 📊 Firestore Data Structure

### /users/{userId}
```typescript
{
  credits: 50,              // Current credit balance
  email: "user@example.com",
  displayName: "John Doe",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### /billing/{transactionId}
```typescript
{
  userId: "user-uid",
  type: "purchase" | "charge",
  amount: 500,              // Amount in kobo (NGN)
  credits: 50,              // Credits added/deducted
  status: "success" | "pending" | "failed",
  timestamp: Timestamp,
  paystackReference: "T123456789",
  metadata: {
    action: "image-generation",
    prompt: "A sunset over mountains",
    conversationId: "conv-123"
  }
}
```

### /subscriptions/{userId}
```typescript
{
  planId: "pro",
  status: "active" | "inactive" | "cancelled",
  paystackSubscriptionCode: "SUB_xxxxx",
  startDate: Timestamp,
  nextBillingDate: Timestamp,
  credits: 150,             // Credits included in plan
  amount: 1200,             // Amount in kobo (NGN)
  emailToken: "token-xxx",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 💰 Credit Packages

Configured in `/functions/src/paystackIntegration.ts`:

| Package  | Credits | Price (NGN) | Price/Credit |
|----------|---------|-------------|--------------|
| Starter  | 50      | ₦500        | ₦10.00       |
| Pro      | 150     | ₦1,200      | ₦8.00        |
| Premium  | 500     | ₦3,500      | ₦7.00        |

### Credit Costs

| Action            | Credits | Price (at ₦10/credit) |
|-------------------|---------|------------------------|
| Image Generation  | 5       | ₦50                    |
| Image Editing     | 3       | ₦30                    |
| Admin Override    | 0       | Free                   |

## 🔒 Security Best Practices

### 1. Webhook Signature Verification

All webhooks are verified using HMAC SHA512:

```typescript
import crypto from 'crypto';

const hash = crypto
  .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (hash !== signature) {
  // Reject webhook
}
```

### 2. Idempotency

Webhooks use `paystackReference` as idempotency key to prevent duplicate processing:

```typescript
const existingTx = await db
  .collection('billing')
  .where('paystackReference', '==', reference)
  .get();

if (!existingTx.empty) {
  // Already processed, skip
}
```

### 3. Admin Privileges

Admin users have unlimited credits:

```typescript
const isAdmin = userRecord.customClaims?.admin === true;
if (isAdmin) {
  // Skip credit charging
}
```

Set admin claims:

```bash
firebase auth:users:set-claims user@example.com admin=true
```

## 🔄 Webhook Reconciliation

Manually reconcile missed webhooks:

```bash
# Call reconciliation function
curl -X POST \
  https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/reconcileWebhooks \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)"
```

This function:
1. Fetches recent transactions from Paystack API
2. Compares with Firestore billing records
3. Processes any missing transactions
4. Logs discrepancies

## 🧪 Testing Checklist

- [ ] Purchase credits with test card
- [ ] Verify credit balance updates in Firestore
- [ ] Generate image (should deduct 5 credits)
- [ ] Edit image (should deduct 3 credits)
- [ ] Test insufficient credits (should return 402 error)
- [ ] Test webhook signature verification
- [ ] Test subscription creation
- [ ] Test subscription cancellation
- [ ] Test admin override (0 credits charged)
- [ ] Test webhook reconciliation

## 🐛 Troubleshooting

### Webhook not receiving events

1. Check Paystack Dashboard > Settings > API Keys & Webhooks
2. Verify webhook URL is correct
3. Check webhook logs in Paystack Dashboard
4. Verify Cloud Function is deployed: `firebase functions:list`
5. Check Cloud Function logs: `firebase functions:log`

### Credits not updating

1. Check Firestore security rules allow function writes
2. Check Cloud Function logs for errors
3. Verify webhook signature is correct
4. Check Firestore indexes (auto-created on first query)

### Payment fails in production

1. Switch from test keys to live keys
2. Update webhook URL to production function
3. Verify Paystack account is verified and active
4. Check transaction logs in Paystack Dashboard

## 📚 Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api)
- [Paystack Webhook Documentation](https://paystack.com/docs/payments/webhooks)
- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Secrets Management](https://firebase.google.com/docs/functions/config-env)

## 🆘 Support

For issues or questions:

1. Check Firebase Cloud Function logs
2. Check Paystack Dashboard transaction logs
3. Review Firestore data structure
4. Check webhook signature verification
5. Test with Paystack test cards first
