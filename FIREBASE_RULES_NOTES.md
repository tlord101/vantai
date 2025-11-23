# Firebase Realtime Database Security Rules - Production Notes

## PRODUCTION SECURITY NOTES

### 1. CREDITS & SUBSCRIPTIONS
- Currently set to `.write: false` for all users
- Must be updated via Cloud Functions using Firebase Admin SDK
- Never allow client-side writes to credits/subscriptions
- Example Cloud Function:
  ```js
  const admin = require('firebase-admin');
  await admin.database().ref(`users/${uid}/credits`).set(newCredits);
  ```

### 2. CUSTOM CLAIMS (Optional)
- Add custom claims for admin users or service roles
- Example: `auth.token.admin === true`
- Set via Admin SDK: `admin.auth().setCustomUserClaims(uid, { admin: true })`

### 3. VALIDATION
- Add more specific validation rules for production
- Validate data types, lengths, and formats
- Example: Email validation, phone number formats, etc.

### 4. RATE LIMITING
- Consider implementing rate limiting in Cloud Functions
- Prevent spam and abuse (message flooding, etc.)

### 5. INDEXES
- Add proper indexes for queries in firebase.json
- Example: Query conversations by lastMessage.createdAt

### 6. STORAGE RULES
- Create separate Storage rules for file uploads
- Validate file sizes, types, and ownership
- Example: Only allow image uploads to `/messages/{conversationId}/{messageId}`

### 7. TESTING
- Use Firebase Emulator Suite for local testing
- Write security rules tests before deploying
- Command: `firebase emulators:start`

## DEPLOYMENT

Deploy these rules using Firebase CLI:
```bash
firebase deploy --only database
```

Or update via Firebase Console:
- Firebase Console > Realtime Database > Rules

## Security Rule Explanation

### Users
- **Read**: Users can only read their own data
- **Profile Write**: Users can update their own profile (name, email, etc.)
- **Credits**: Read-only for users, must be updated server-side via Cloud Functions
- **Subscription**: Read-only for users, must be updated server-side via Cloud Functions

### Conversations
- **Read**: Users can read conversations they're participants in
- **Write**: Users can create/update conversations they're part of

### Messages
- **Read**: Users can read messages from conversations they're in
- **Write**: Users can only write messages they're sending (senderId must match auth.uid)
- **Validation**: Messages must have required fields (senderId, text, createdAt, type)

### User Status
- **Read**: All authenticated users can read any user's status (for presence indicators)
- **Write**: Users can only update their own status
