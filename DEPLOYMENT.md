# Deployment Instructions

## Firebase Setup (CRITICAL - Must do this to fix permissions error)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vantflowv1**
3. Navigate to **Firestore Database**
4. Click on **Rules** tab
5. The rules are already in `firestore.rules` file - deploy them using one of these methods:

### Method 1: Firebase Console (Manual)
Copy the content from `firestore.rules` and paste it in the Firebase Console Rules editor, then click **Publish**.

### Method 2: Firebase CLI (Recommended)
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

## Verify Deployment

After updating the rules:
1. Reload your app
2. Sign in with Google
3. The "Missing or insufficient permissions" error should be resolved
4. Credits should load properly

## Pricing Updated

- **1 Nano = ₦1,000** (updated from ₦100)
- **Minimum purchase: 10 Nano = ₦10,000**
- **Cost per generation: 1 Nano**

## Paystack Integration

- Paystack script is now loaded directly in HTML for reliability
- Better error handling for payment failures
- Improved transaction reference generation

## What Changed

✅ Fixed pricing: 1 Nano = ₦1,000
✅ Added Firestore security rules to fix permissions error
✅ Improved Paystack integration with better error handling
✅ Paystack script loaded in HTML instead of dynamically
✅ Better transaction reference generation

## Testing Payments

Use Paystack test cards:
- **Card Number:** 4084084084084081
- **Expiry:** Any future date
- **CVV:** 408

This will simulate a successful payment without charging real money.
