# Admin Setup Guide

## Admin Credentials
- **Email**: `admin@vant.io`
- **Password**: `admin123`

## Setup Instructions

### Option 1: Manual Setup via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add User**
5. Enter:
   - Email: `admin@vant.io`
   - Password: `admin123`
6. Click **Add User**

### Option 2: Create Admin via App

1. Open the VanTai app
2. Click **Sign Up**
3. Enter:
   - Name: `Admin`
   - Email: `admin@vant.io`
   - Password: `admin123`
4. Complete signup

The app will automatically detect this email and grant admin privileges.

## Admin Features

Once logged in as admin, you will have access to:

### Dashboard Overview
- **Total Users**: View count of all registered users
- **Plan Distribution**: See how many users are on each plan (Free, Basic, Premium)
- **Real-time Stats**: Updated statistics dashboard

### User Management
- **View All Users**: See complete list of all registered users
- **User Details**: View each user's:
  - Email address
  - User ID
  - Current subscription plan
  - Images used today
  - Subscription expiry date

### Subscription Management
- **Change User Plans**: Instantly upgrade or downgrade any user's subscription
- **Available Actions**:
  - Set to Free Plan (0 images/day)
  - Set to Basic Plan (10 images/day, 1 month duration)
  - Set to Premium Plan (unlimited images, 1 month duration)

## Admin Access

The admin check is based on the email address:
```typescript
if (user.email === 'admin@vant.io') {
  setIsAdmin(true);
}
```

Only users with the exact email `admin@vant.io` will have admin access.

## Security Notes

⚠️ **Important Security Considerations**:

1. **Change Default Password**: After first login, consider changing the admin password via Firebase Console
2. **Firestore Rules**: Ensure Firestore security rules restrict admin operations:
   ```javascript
   // In firestore.rules
   match /subscriptions/{userId} {
     allow read, write: if request.auth != null && 
                         (request.auth.uid == userId || 
                          request.auth.token.email == 'admin@vant.io');
   }
   
   match /users/{userId} {
     allow read: if request.auth != null;
     allow write: if request.auth != null && 
                     (request.auth.uid == userId || 
                      request.auth.token.email == 'admin@vant.io');
   }
   ```

3. **Admin Email Protection**: Don't allow regular users to sign up with @vant.io domain
4. **Audit Logs**: Consider implementing logging for admin actions

## Testing Admin Access

1. **Login**: Use `admin@vant.io` / `admin123`
2. **Verify Dashboard**: Should see admin dashboard instead of chat interface
3. **Test User Management**:
   - View list of users
   - Change a user's subscription plan
   - Verify changes are reflected immediately

4. **Logout**: Click "Sign Out" button in admin dashboard

## Troubleshooting

### "Admin dashboard not showing"
- Verify you're logged in with exact email: `admin@vant.io`
- Check browser console for errors
- Clear browser cache and localStorage

### "Cannot see other users"
- Ensure Firestore rules allow reading `users` collection
- Check that users have data in Firestore (created during signup)

### "Cannot update user plans"
- Verify Firestore rules allow writing to `subscriptions` collection
- Check browser console for permission errors

## Future Enhancements

Consider adding:
- [ ] Admin user roles (super admin, moderator, etc.)
- [ ] Bulk user operations
- [ ] User search and filtering
- [ ] Export user data to CSV
- [ ] Activity logs and audit trail
- [ ] Email notifications to users on plan changes
- [ ] Payment transaction history
- [ ] Usage analytics and reporting
