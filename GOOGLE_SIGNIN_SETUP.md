# Google Sign-In Setup Guide

## Overview
Google Sign-In is already implemented in the VanTai app. You just need to enable it in Firebase Console.

## ✅ Current Implementation Status

The code is already configured with:
- ✅ Google OAuth provider setup
- ✅ Sign-in popup flow
- ✅ User data storage in Firestore
- ✅ Error handling
- ✅ Admin detection for Google accounts
- ✅ Profile and email scopes
- ✅ Account selection prompt

## 🔧 Firebase Console Setup (Required)

### Step 1: Enable Google Sign-In Method

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vantflowv1**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Google** in the providers list
5. Click on **Google**
6. Toggle **Enable** switch to ON
7. Select a **Project support email** from dropdown (your email)
8. Click **Save**

**That's it!** Google Sign-In will now work immediately.

### Step 2: (Optional) Configure OAuth Consent Screen

For production apps, you may want to customize the OAuth consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **vantflowv1**
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure:
   - **App name**: VanTai AI Image Generator
   - **User support email**: Your email
   - **App logo**: Upload your logo (optional)
   - **Authorized domains**: Add your domain
   - **Developer contact**: Your email
5. Click **Save and Continue**

## 🧪 Testing Google Sign-In

### Test the Implementation:

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open the app** in your browser

3. **Click "Continue with Google"** button

4. **Expected Flow**:
   - Google account selection popup appears
   - Choose an account
   - Grant permissions (first time only)
   - Redirected back to app
   - User is logged in automatically
   - User data saved to Firestore

5. **Verify in Firebase**:
   - Go to **Authentication** → **Users**
   - You should see the new user with Google provider
   - Go to **Firestore** → **users** collection
   - User document should contain: email, displayName, photoURL, lastLogin

### Test Admin Access:

1. **Use Google account**: `admin@vant.io`
2. Sign in with Google
3. Should be redirected to **Admin Dashboard** (not chat)
4. Verify admin features work

## 🎨 UI Features

The Google Sign-In button includes:
- ✨ Glass morphism design matching app theme
- 🎨 Official Google logo (4-color)
- 💫 Hover and tap animations
- ⏳ Loading state during authentication
- ❌ Error messages if sign-in fails
- 📱 Mobile-responsive design

## 🔒 Security Features

- **Popup-based flow**: More secure than redirect (prevents phishing)
- **Account selection**: Users can choose which Google account to use
- **Firestore rules**: User data protected by security rules
- **Admin detection**: Automatically grants admin privileges to `admin@vant.io`
- **Error handling**: Graceful error messages for users

## 🐛 Troubleshooting

### Error: "This app isn't verified"
**Solution**: This is normal for development. Click "Advanced" → "Go to VanTai (unsafe)" to continue.

For production, you need to verify your app in Google Cloud Console.

### Error: "Popup closed by user"
**Cause**: User closed the popup before completing sign-in.
**Solution**: This is expected behavior. User just needs to try again.

### Error: "auth/popup-blocked"
**Cause**: Browser is blocking popups.
**Solution**: 
- Allow popups for your site
- Check browser popup blocker settings
- Try a different browser

### Error: "auth/unauthorized-domain"
**Cause**: Your domain is not authorized in Firebase.
**Solution**:
1. Go to Firebase Console → Authentication → Settings
2. Under "Authorized domains", add your domain
3. For local development, `localhost` should already be there

### Google Sign-In button not working
**Checklist**:
- ✅ Is Google sign-in enabled in Firebase Console?
- ✅ Is the correct Firebase config in `.env` file?
- ✅ Are there any console errors?
- ✅ Is your internet connection working?
- ✅ Try clearing browser cache

### User not appearing in Firestore
**Cause**: Firestore rules may be blocking writes.
**Solution**:
- Verify `firestore.rules` is deployed
- Check that `users` collection write rules are correct
- Look for errors in browser console

## 📊 What Happens During Google Sign-In

1. **User clicks button** → Loading state starts
2. **Popup opens** → Google account selection
3. **User selects account** → Consent screen (first time)
4. **Firebase authenticates** → Gets user credentials
5. **User data stored** → Firestore `users` collection:
   ```json
   {
     "email": "user@gmail.com",
     "displayName": "John Doe",
     "photoURL": "https://...",
     "lastLogin": "2025-11-23T...",
     "isAdmin": false
   }
   ```
6. **Subscription created** → Firestore `subscriptions` collection:
   ```json
   {
     "plan": "free",
     "startDate": "2025-11-23T...",
     "endDate": "2026-11-23T...",
     "imagesUsedToday": 0
   }
   ```
7. **User redirected** → Chat interface (or Admin Dashboard if admin)

## 🚀 Production Checklist

Before deploying to production:

- [ ] Enable Google Sign-In in Firebase Console
- [ ] Configure OAuth consent screen
- [ ] Add production domain to authorized domains
- [ ] Verify app in Google Cloud Console (if needed)
- [ ] Test Google Sign-In on production URL
- [ ] Set up proper error logging
- [ ] Configure custom OAuth scopes if needed
- [ ] Update privacy policy with Google Sign-In info
- [ ] Test on multiple browsers and devices

## 📝 Additional Configuration

### Custom Scopes (Optional)
The app already requests `profile` and `email` scopes. To add more:

```typescript
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
```

### Custom Parameters (Optional)
Already configured to show account selection:

```typescript
provider.setCustomParameters({
  prompt: 'select_account'  // Always show account picker
});
```

Other options:
- `prompt: 'consent'` - Always show consent screen
- `login_hint: 'user@example.com'` - Pre-fill email

## 🎯 Summary

**To enable Google Sign-In:**
1. ✅ Code is already implemented
2. ⚙️ Enable in Firebase Console (1 minute)
3. 🧪 Test the flow
4. ✨ Done!

**Current Features:**
- One-click sign-in with Google
- Automatic user profile creation
- Admin account detection
- Beautiful UI with animations
- Comprehensive error handling
- Mobile responsive

---

**Status**: ✅ Code complete, just needs Firebase Console enablement  
**Time to setup**: ~1 minute  
**Difficulty**: Easy
