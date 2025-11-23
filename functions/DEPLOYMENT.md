# Gemini Proxy Deployment Guide

## Prerequisites

1. **Firebase CLI**: Install globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Google Cloud Project**: Create or use existing project
   - Enable Billing
   - Enable required APIs

3. **Firebase Project**: Initialize Firebase
   ```bash
   firebase login
   firebase init
   ```

## Step-by-Step Deployment

### 1. Enable Required Google Cloud APIs

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Enable Cloud Vision API (for face detection)
gcloud services enable vision.googleapis.com --project=$PROJECT_ID

# Enable Generative Language API (for Gemini)
gcloud services enable generativelanguage.googleapis.com --project=$PROJECT_ID

# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com --project=$PROJECT_ID

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key or use existing
3. Copy the API key

### 3. Configure Environment Variables

Option A: Using Firebase Functions Config (Recommended for Production)
```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
firebase functions:config:set gemini.endpoint="https://generativelanguage.googleapis.com"
```

Option B: Using `.env` file (For Local Development)
```bash
cd functions
cp .env.example .env
# Edit .env and add your API key
```

### 4. Install Dependencies

```bash
cd functions
npm install
```

### 5. Build TypeScript

```bash
npm run build
```

### 6. Test Locally (Optional)

```bash
npm run serve
```

This starts the Functions emulator at `http://localhost:5001`.

### 7. Deploy to Firebase

Deploy all functions:
```bash
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:generateImage
firebase deploy --only functions:editImage
firebase deploy --only functions:approveEdit
```

### 8. Verify Deployment

```bash
firebase functions:log
```

Check the Firebase Console for deployed function URLs:
- Functions → Dashboard
- Copy the function URLs for client integration

## Post-Deployment Configuration

### Set Up Firestore Indexes (if needed)

If you see index errors in logs, create them:
```bash
firebase deploy --only firestore:indexes
```

### Set Up Admin Users

Grant admin privileges to specific users:

```javascript
// Using Node.js with Firebase Admin SDK
const admin = require('firebase-admin');
admin.initializeApp();

async function setAdminClaim(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`Admin claim set for user: ${uid}`);
}

// Replace with actual user ID
setAdminClaim('user-id-here');
```

### Configure CORS (if needed)

If calling from web apps, update CORS settings in `geminiProxy.ts`:
```typescript
res.set("Access-Control-Allow-Origin", "https://yourdomain.com");
```

## Environment Configuration

### Production Environment Variables

Set these in Firebase Console or via CLI:

```bash
# Gemini Configuration
firebase functions:config:set gemini.api_key="your_key"
firebase functions:config:set gemini.endpoint="https://generativelanguage.googleapis.com"

# Rate Limiting (optional - defaults in code)
firebase functions:config:set ratelimit.window_ms="3600000"
firebase functions:config:set ratelimit.max_requests="20"
```

View current config:
```bash
firebase functions:config:get
```

## Firestore Security Rules

Add these rules to `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rate limits - only functions can write
    match /rateLimits/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions
    }
    
    // Audit logs - admins only
    match /auditLogs/{logId} {
      allow read: if request.auth.token.admin == true;
      allow write: if false; // Only Cloud Functions
    }
    
    // Admin approvals - admins only
    match /adminApprovals/{approvalId} {
      allow read: if request.auth.token.admin == true;
      allow write: if false; // Only Cloud Functions
    }
    
    // Conversations - users can read their own
    match /conversations/{conversationId} {
      allow read: if request.auth != null;
      
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow write: if false; // Only Cloud Functions
      }
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Monitoring and Logging

### View Logs
```bash
# All function logs
firebase functions:log

# Specific function
firebase functions:log --only generateImage

# Follow logs in real-time
firebase functions:log --follow
```

### Set Up Alerts

In Firebase Console:
1. Functions → Health
2. Set up alerts for:
   - High error rates
   - Slow execution times
   - Memory issues

### Monitor Costs

1. Go to Google Cloud Console → Billing
2. Set up budget alerts
3. Monitor:
   - Function invocations
   - Cloud Vision API calls
   - Gemini API usage

## Testing Deployed Functions

### Get Function URLs

```bash
firebase functions:config:get
```

Or check Firebase Console → Functions.

### Test with cURL

```bash
# Get Firebase ID token first (use Firebase Auth in your app)
export ID_TOKEN="your_firebase_id_token"
export FUNCTION_URL="https://us-central1-your-project.cloudfunctions.net"

# Test generate-image
curl -X POST "$FUNCTION_URL/generateImage" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful mountain landscape",
    "conversationId": "test-conv-123"
  }'

# Test edit-image
curl -X POST "$FUNCTION_URL/editImage" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Change background to blue sky",
    "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
    "conversationId": "test-conv-123",
    "preserveIdentity": true
  }'
```

## Troubleshooting

### Common Issues

**1. "UNAUTHENTICATED" Error**
- Check ID token is valid and not expired
- Verify Authorization header format: `Bearer <token>`

**2. "Permission Denied" for Cloud Vision**
- Enable Cloud Vision API
- Check service account has `roles/cloudvision.admin`

**3. "Gemini API Error"**
- Verify API key is correct
- Check API quota limits
- Ensure Generative Language API is enabled

**4. Rate Limit Issues**
- Check Firestore `/rateLimits` collection
- Manually reset if needed: delete user's rate limit doc

**5. Function Timeout**
- Increase timeout in `firebase.json`:
  ```json
  {
    "functions": {
      "timeoutSeconds": 300,
      "memory": "1GB"
    }
  }
  ```

### Debug Mode

Enable detailed logging:
```typescript
// In geminiProxy.ts, set at top:
functions.logger.setLevel("DEBUG");
```

## Security Checklist

- [ ] API keys stored in environment config (not in code)
- [ ] Firestore rules deployed and tested
- [ ] Admin users properly configured
- [ ] CORS configured for production domains only
- [ ] Rate limits set appropriately
- [ ] Audit logging enabled
- [ ] Budget alerts configured
- [ ] Error monitoring set up

## Updating Functions

```bash
# Make code changes
cd functions/src
# Edit files...

# Rebuild
cd ..
npm run build

# Deploy updates
firebase deploy --only functions
```

## Rollback

If deployment has issues:
```bash
# List versions
gcloud functions list

# Rollback to previous version (via Google Cloud Console)
# Functions → Select function → Versions → Restore previous version
```

## Production Checklist

Before going live:
- [ ] Test all endpoints thoroughly
- [ ] Verify rate limiting works
- [ ] Test policy enforcement with various prompts
- [ ] Confirm audit logs are being written
- [ ] Set up monitoring and alerts
- [ ] Document API for client developers
- [ ] Configure production CORS domains
- [ ] Review and set appropriate timeout/memory
- [ ] Test admin approval workflow
- [ ] Verify Gemini API quota is sufficient

## Support

For issues:
1. Check Firebase Functions logs
2. Review audit logs in Firestore
3. Check Google Cloud Console for API errors
4. Verify environment configuration
5. Open GitHub issue if bug found

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
