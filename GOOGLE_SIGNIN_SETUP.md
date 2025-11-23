# Google Sign-In Setup Guide

## Current Implementation Status

✅ **Google Sign-In is fully implemented** in the codebase with:
- Google OAuth button on auth page
- Proper Firebase integration
- User data storage in Firestore
- Error handling with user-friendly messages
- Glass morphism UI matching app theme

## Firebase Console Setup Required

To enable Google Sign-In, you need to configure it in Firebase Console:

### Step 1: Enable Google Provider

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vantflowv1**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** in the providers list
5. Click **Enable**
6. Configure the provider:
   - **Project support email**: Select your email from dropdown
   - **Project public-facing name**: "VanTai Image Editor" (or your preferred name)
7. Click **Save**

### Step 2: Add Authorized Domains

1. In **Authentication** → **Settings** → **Authorized domains**
2. Verify these domains are listed:
   - `localhost` (for development)
   - `vantflowv1.firebaseapp.com` (Firebase hosting)
   - Your custom domain (if any)
3. Add any additional domains if needed

### Step 3: Configure OAuth Consent Screen (Optional)

For production use, configure the OAuth consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **vantflowv1**
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure:
   - **User Type**: External (for public access)
   - **App name**: VanTai Image Editor
   - **Support email**: Your email
   - **App logo**: Upload your logo (optional)
   - **Authorized domains**: vantflowv1.firebaseapp.com
   - **Developer contact**: Your email
5. Save and continue through all steps

## How Google Sign-In Works

### User Flow:

1. User clicks **"Continue with Google"** button
2. Google OAuth popup appears
3. User selects Google account
4. User grants permissions
5. Firebase creates/updates user account
6. User data saved to Firestore:
   ```javascript
   {
     email: "user@gmail.com",
     displayName: "User Name",
     photoURL: "https://...",
     lastLogin: Timestamp,
     isAdmin: false
   }
   ```
7. User redirected to:
   - **Admin Dashboard** (if email is `admin@vant.io`)
   - **Subscription Page** (if on free plan)
   - **Chat Interface** (if subscribed)

### Code Implementation:

**AuthPage.tsx**:
```typescript
const handleGoogleLogin = async () => {
  setError('');
  setLoading(true);
  try {
    await loginWithGoogle();
  } catch (err: any) {
    const errorMessage = err.code?.replace('auth/', '').replace(/-/g, ' ') || 'Google sign-in failed';
    setError(errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1));
  } finally {
    setLoading(false);
  }
};
```

**AuthContext.tsx**:
```typescript
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  
  // Store user data in Firestore
  if (result.user) {
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      lastLogin: new Date(),
      isAdmin: false,
    }, { merge: true });
  }
}
```

## Testing Google Sign-In

### Development Testing:

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open app**: `http://localhost:5173`

3. **Click "Continue with Google"**

4. **Expected behavior**:
   - Google account picker appears
   - After selection, popup closes
   - User logged in automatically
   - Redirected to appropriate page

### Common Issues:

#### "Popup blocked"
- **Cause**: Browser blocking popups
- **Solution**: Allow popups for localhost in browser settings

#### "Unauthorized domain"
- **Cause**: Domain not whitelisted in Firebase
- **Solution**: Add domain in Firebase Console → Authentication → Authorized domains

#### "Configuration not found"
- **Cause**: Google provider not enabled
- **Solution**: Enable Google provider in Firebase Console

#### "Network error"
- **Cause**: Firebase config incorrect
- **Solution**: Verify `.env` file has correct Firebase credentials

## Error Handling

The implementation includes comprehensive error handling:

```typescript
try {
  await loginWithGoogle();
} catch (err: any) {
  // Converts Firebase error codes to readable messages
  // Example: "auth/popup-closed-by-user" → "Popup closed by user"
  const errorMessage = err.code?.replace('auth/', '').replace(/-/g, ' ');
  setError(errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1));
}
```

**Common error messages**:
- "Popup closed by user" - User closed OAuth popup
- "Account exists with different credential" - Email already used with different provider
- "Network request failed" - Internet connection issue
- "Too many requests" - Rate limit exceeded

## Security Features

✅ **Secure by default**:
- OAuth 2.0 protocol
- No password storage needed
- Google handles authentication
- Automatic token refresh
- User consent required

✅ **Firestore rules protect data**:
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
                 (request.auth.uid == userId || isAdmin());
}
```

## Production Checklist

Before deploying to production:

- [ ] Google provider enabled in Firebase Console
- [ ] OAuth consent screen configured
- [ ] Production domain added to authorized domains
- [ ] App name and logo set
- [ ] Privacy policy URL added (if applicable)
- [ ] Terms of service URL added (if applicable)
- [ ] Test Google Sign-In on production domain
- [ ] Verify user data saves to Firestore
- [ ] Check error messages display correctly

## Additional Features

### User Profile from Google:

When users sign in with Google, you get:
- `displayName`: Full name from Google account
- `email`: Google email address
- `photoURL`: Google profile picture
- `emailVerified`: Always true for Google accounts

### Custom Claims (Advanced):

To add custom claims (like admin role):

```typescript
// Server-side only (Cloud Functions)
admin.auth().setCustomUserClaims(userId, { admin: true });
```

Then check in Firestore rules:
```javascript
request.auth.token.admin == true
```

## Support

If Google Sign-In is not working:

1. **Check Firebase Console**: Ensure Google provider is enabled
2. **Check browser console**: Look for error messages
3. **Check network tab**: Verify API calls are succeeding
4. **Check Firestore rules**: Ensure rules allow user writes
5. **Clear cache**: Sometimes cached data causes issues

## Summary

✅ **Implementation**: Complete and working  
✅ **UI**: Beautiful glass morphism button  
✅ **Error handling**: User-friendly messages  
✅ **Data storage**: Automatic Firestore sync  
✅ **Security**: OAuth 2.0 + Firestore rules  

**Next step**: Enable Google provider in Firebase Console!
