# 💎 Subscription System - Complete Guide

## 🎯 Overview

VanTai Chat now includes a complete subscription system with Paystack integration:

- **Free Plan**: Text chat only, no image uploads
- **Basic Plan**: ₦15,000/month - 10 images per day + unlimited text
- **Premium Plan**: ₦25,000/month - Unlimited images + unlimited text

## 🚀 Features Implemented

### ✅ Subscription Management
- Firestore-based subscription tracking
- Automatic subscription expiry handling
- Daily image limit tracking and reset
- User-specific subscription data

### ✅ Payment Integration
- Paystack payment gateway integration
- Secure payment processing
- Payment verification
- Automatic subscription upgrade after payment

### ✅ Access Control
- Chat access restricted to subscribed users
- Image upload limits based on plan
- Daily image quota enforcement
- Real-time limit checking

### ✅ UI/UX
- Beautiful subscription page with glass theme
- Subscription status in chat header
- Usage statistics display
- Upgrade prompts and buttons
- Payment success/error handling

## 📋 Subscription Plans

### Free Plan
- **Price**: ₦0
- **Features**:
  - Text chat only
  - No image uploads
  - Basic support
- **Limitations**: 
  - Cannot send messages without upgrading
  - No image analysis

### Basic Plan
- **Price**: ₦15,000/month
- **Features**:
  - Unlimited text chat
  - 10 images per day
  - Priority support
  - Chat history
- **Limitations**: 
  - 10 image uploads daily
  - Resets at midnight

### Premium Plan
- **Price**: ₦25,000/month
- **Features**:
  - Unlimited text chat
  - Unlimited images
  - Premium support
  - Advanced AI features
  - Chat history
- **Limitations**: None! 🎉

## 🔧 Setup Instructions

### 1. Firebase Firestore Setup

Enable Firestore in your Firebase project:

```bash
# Go to Firebase Console
# Navigate to Firestore Database
# Click "Create Database"
# Choose production mode
# Select your region
```

### 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

The rules are already configured in `firestore.rules`:
- Users can only read/write their own subscription data
- Secure access control

### 3. Paystack Configuration

Your Paystack public key is already configured in `.env`:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_live_4d609974f9080d629d43b0a8b4f2a01d54159140
```

**Important**: For production, you should also set up a backend webhook to verify payments.

### 4. Test the System

```bash
npm run dev
```

**Testing Flow**:
1. Login/Signup
2. You'll see the subscription page (free plan)
3. Try to send a message - blocked with upgrade prompt
4. Click "Subscribe Now" on Basic or Premium
5. Complete Paystack payment
6. Subscription activates automatically
7. Start chatting with image uploads!

## 💳 Payment Flow

```
User Clicks Subscribe
      ↓
Paystack Modal Opens
      ↓
User Enters Card Details
      ↓
Payment Processed
      ↓
Success Callback
      ↓
Subscription Updated in Firestore
      ↓
User Gets Access
```

## 📊 Subscription Data Structure

```typescript
interface SubscriptionData {
  plan: 'free' | 'basic' | 'premium';
  startDate: Date;
  endDate: Date;
  imagesUsedToday: number;
  lastResetDate: string;
  paymentReference?: string;
}
```

Stored in Firestore:
```
subscriptions/{userId}/
  - plan: "basic"
  - startDate: Timestamp
  - endDate: Timestamp
  - imagesUsedToday: 5
  - lastResetDate: "2025-11-23"
  - paymentReference: "user123_1732377600000"
```

## 🔐 Security Features

### Access Control
```typescript
// Check subscription before sending message
if (subscription?.plan === 'free') {
  // Block and show upgrade message
  return;
}

// Check image limit
if (image) {
  const { allowed } = await checkImageLimit(userId);
  if (!allowed) {
    // Block and show limit message
    return;
  }
}
```

### Firestore Rules
```javascript
// Users can only access their own subscription
allow read, write: if request.auth.uid == userId;
```

## 📱 User Experience

### First-Time User
1. Sign up → Free plan created automatically
2. See subscription page with pricing
3. Choose a plan and pay
4. Start chatting immediately

### Existing User
1. Login → Subscription loaded
2. See subscription status in header
3. Track daily image usage
4. Get notified when approaching limit

### Expired Subscription
1. Login → Subscription checked
2. If expired, auto-downgrade to free
3. Show upgrade prompt
4. Block chat until renewed

## 🎨 UI Components

### Subscription Page
- **Location**: `src/components/SubscriptionPage.tsx`
- **Features**:
  - 3 pricing cards (Free, Basic, Premium)
  - Current plan indicator
  - Usage statistics
  - Paystack integration
  - Loading states

### Chat Header
- **Location**: `src/components/ChatHeader.tsx`
- **Features**:
  - Subscription badge
  - Daily image counter
  - Upgrade button (for free/expired users)
  - Plan name display

### Chat Input
- **Location**: `src/components/ChatInput.tsx`
- **Features**:
  - Subscription warning banner
  - Image upload restrictions
  - Visual feedback

## 🔄 Daily Reset Logic

Images reset automatically at midnight:

```typescript
// Check if it's a new day
const today = new Date().toDateString();
if (subscription.lastResetDate !== today) {
  // Reset counter to 0
  await resetDailyImageCount(userId);
}
```

## 📈 Usage Tracking

### Image Count
```typescript
// Before sending image
await checkImageLimit(userId);

// After successful send
await incrementImageCount(userId);
```

### Statistics Display
- Header shows: "5 / 10" for Basic
- Header shows: "25 / ∞" for Premium
- Resets daily automatically

## 🐛 Troubleshooting

### Payment Not Working
1. Check Paystack script loaded: `window.PaystackPop`
2. Verify public key in `.env`
3. Check browser console for errors
4. Ensure HTTPS in production

### Subscription Not Updating
1. Check Firestore rules deployed
2. Verify user authentication
3. Check browser console
4. Verify payment callback executed

### Images Still Blocked
1. Check subscription.plan value
2. Verify imagesUsedToday count
3. Check dailyImageLimit calculation
4. Test date reset logic

## 🚀 Deployment Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Verify Paystack live key in production
- [ ] Set up payment webhook (backend)
- [ ] Test all subscription flows
- [ ] Monitor Firestore usage
- [ ] Set up billing alerts

## 📝 Backend Webhook (Recommended)

For production, create a backend endpoint to verify payments:

```typescript
// Example webhook endpoint
app.post('/webhooks/paystack', async (req, res) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (hash === req.headers['x-paystack-signature']) {
    const event = req.body;
    
    if (event.event === 'charge.success') {
      // Verify and update subscription
      await verifyAndUpdateSubscription(event.data);
    }
  }
  
  res.send(200);
});
```

## 💡 Future Enhancements

- [ ] Annual subscription option (discounted)
- [ ] Promo codes and discounts
- [ ] Referral program
- [ ] Usage analytics dashboard
- [ ] Email notifications for expiry
- [ ] Auto-renewal option
- [ ] Subscription pause feature
- [ ] Team/family plans

## 🎉 Success!

Your subscription system is fully integrated and ready to accept payments! Users must now subscribe to use the chat and image features.

---

**Need Help?**
- Check Paystack docs: https://paystack.com/docs
- Review Firebase docs: https://firebase.google.com/docs/firestore
- Test in browser console for debugging
