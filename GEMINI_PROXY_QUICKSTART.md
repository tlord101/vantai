# Gemini Proxy Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd /workspaces/vantai/functions
npm install
```

### 2. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

### 3. Configure Environment
```bash
# Create .env file
cp .env.example .env

# Edit .env and paste your API key
nano .env
# Add: GEMINI_API_KEY=your_actual_key_here
```

Or set via Firebase CLI:
```bash
firebase functions:config:set gemini.api_key="your_actual_key_here"
```

### 4. Enable Required APIs
```bash
# Enable Cloud Vision API (for face detection)
gcloud services enable vision.googleapis.com

# Enable Generative Language API (for Gemini)
gcloud services enable generativelanguage.googleapis.com
```

### 5. Test Locally
```bash
# Start emulator
npm run serve

# In another terminal, test the endpoint
curl -X POST http://localhost:5001/your-project/us-central1/generateImage \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset over mountains"}'
```

### 6. Deploy to Production
```bash
# Build
npm run build

# Deploy
firebase deploy --only functions
```

## 📋 Common Tasks

### Generate an Image
```typescript
import { GeminiProxyClient } from './lib/geminiProxyClient';

const client = new GeminiProxyClient();
const result = await client.generateImage("A serene lake at dawn");
console.log(result.imageData); // Use this in <img src={...} />
```

### Edit an Image (Safe)
```typescript
const result = await client.editImage({
  prompt: "Change hair color to red",
  imageData: base64Image,
  preserveIdentity: true,
});
```

### Edit an Image (Policy Violation Example)
```typescript
try {
  const result = await client.editImage({
    prompt: "Replace face with celebrity face",  // ❌ Will be blocked
    imageData: base64Image,
  });
} catch (error) {
  // Error: "Forbidden identity manipulation detected..."
  console.error(error.message);
}
```

### Admin Approval
```typescript
// Only works if user has admin: true custom claim
const result = await client.approveEdit({
  requestId: "req-12345",
  prompt: "Artistic face modification",
  imageData: base64Image,
  reason: "Approved for art project",
});
```

## 🔑 Getting a Firebase ID Token

### In React/Web App
```typescript
import { getAuth } from 'firebase/auth';

async function getToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
}
```

### For Testing (CLI)
```javascript
// test-token.js
const admin = require('firebase-admin');
admin.initializeApp();

async function createCustomToken(uid) {
  const token = await admin.auth().createCustomToken(uid);
  console.log('Custom token:', token);
  // Use this to sign in, then get ID token
}

createCustomToken('test-user-id');
```

## 🛠️ Troubleshooting

### "UNAUTHENTICATED" Error
- Check token is valid: `console.log(await user.getIdToken())`
- Verify header format: `Authorization: Bearer <token>`
- Token might be expired (get fresh one)

### "Rate limit exceeded"
- Wait 1 hour or reset manually:
  ```javascript
  await db.collection('rateLimits').doc(userId).delete();
  ```

### "Policy violation" Error
- Review forbidden keywords in GEMINI_PROXY_SUMMARY.md
- Use cosmetic-only edits for faces
- Try rephrasing prompt

### Face Detection Not Working
- Ensure Cloud Vision API is enabled
- Check service account permissions
- Verify image is valid base64

## 📊 Check Logs

### Development
```bash
firebase functions:log --follow
```

### Production
```bash
firebase functions:log --production
```

### Filter by Function
```bash
firebase functions:log --only editImage
```

## 🔐 Set Admin User

```javascript
// set-admin.js
const admin = require('firebase-admin');
admin.initializeApp();

async function setAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`Admin claim set for ${uid}`);
}

setAdmin('user-id-here');
```

## 💰 Cost Estimates

Approximate costs per 1000 requests:
- **Firebase Functions**: $0.40 (invocations + compute)
- **Cloud Vision API**: $1.50 (face detection)
- **Gemini API**: Varies by model/usage
- **Firestore**: $0.06 (writes for rate limits + logs)

**Total**: ~$2-5 per 1000 image edits

Set budget alerts in Google Cloud Console!

## 🎯 Next Steps

1. ✅ Deploy functions
2. ✅ Test endpoints
3. ✅ Integrate client SDK
4. ✅ Set up monitoring
5. ✅ Configure admin users
6. ✅ Deploy Firestore rules
7. ✅ Set budget alerts

## 📚 Full Documentation

- **README.md**: Complete API reference
- **DEPLOYMENT.md**: Detailed deployment guide
- **TESTING.md**: Test cases and scripts
- **GEMINI_PROXY_SUMMARY.md**: Implementation details

## ⚡ Quick Reference

### Endpoints
- `POST /v1/generate-image` - Generate from text
- `POST /v1/edit-image` - Edit with safety checks
- `POST /v1/approve-edit` - Admin override

### Response Codes
- `200` - Success
- `403` - Policy violation or permission denied
- `429` - Rate limit exceeded
- `401` - Authentication failed

### Policy Rules
- ✅ Hair, makeup, lighting, background
- ❌ Face swap, identity change, structural edits

---

**Ready to go!** Start with local testing, then deploy to production.
