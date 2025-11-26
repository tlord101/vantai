# Update Firestore Security Rules

To fix the "Missing or insufficient permissions" error, you need to update your Firestore security rules.

## Quick Fix (5 minutes)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project** (nano-banana or vantai)
3. **Navigate to Firestore Database**:
   - Click on "Firestore Database" in the left sidebar
4. **Go to Rules tab**:
   - Click on the "Rules" tab at the top
5. **Copy the rules from `firestore.rules` file**
6. **Paste into the Firebase Console editor**
7. **Click "Publish"**

## What These Rules Do

The new rules allow:
- ✅ Users to read/write their own referral data
- ✅ Users to create and track referrals
- ✅ Users to view referral codes (needed for signup tracking)
- ✅ Secure access - users can only modify their own referrals

## Testing

After publishing the rules:
1. Refresh your referral dashboard page
2. The error should be gone
3. You should see your referral link and stats

## Alternative: Development Mode (Quick Test)

If you want to test quickly (NOT recommended for production):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

⚠️ **Warning**: This allows all reads/writes until Dec 31, 2025. Only use for testing!

## Production Rules

Use the rules in `firestore.rules` file for production - they're secure and only allow users to access their own data.
