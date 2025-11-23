# Firebase Cloud Functions - Gemini Image Proxy

## Overview

This Firebase Cloud Functions module provides secure server-side image generation and editing capabilities using Google's Gemini API. It includes comprehensive safety controls to prevent identity manipulation and ensure responsible AI usage.

## Features

### 🔐 Security
- **Firebase Authentication**: ID token verification for all requests
- **Rate Limiting**: Per-user request limits (20 requests/hour by default)
- **Audit Logging**: Comprehensive logging of all operations for security tracking
- **Admin Controls**: Manual override capabilities with full audit trail

### 🛡️ Image Editing Policy Enforcement
- **Identity Preservation**: Blocks attempts to alter facial structure or identity
- **Face Detection**: Uses Google Cloud Vision API to detect faces in images
- **Keyword Filtering**: Prevents forbidden operations like "replace face", "impersonate", etc.
- **Risk Assessment**: Three-tier risk classification (low/medium/high)
- **Cosmetic Edits Only**: For photos with faces, only allows safe cosmetic changes

### 🎨 Image Operations
- **Generate Image**: Create new images from text prompts
- **Edit Image**: Modify existing images with safety controls
- **Conversation Integration**: Automatically persist image references to Firestore

## Endpoints

### POST /v1/generate-image
Generate a new image from a text prompt.

**Request:**
```json
{
  "prompt": "A serene mountain landscape at sunset",
  "conversationId": "optional-conversation-id"
}
```

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "imageData": "base64-encoded-image-or-url",
  "conversationId": "conversation-id"
}
```

### POST /v1/edit-image
Edit an existing image with safety controls.

**Request:**
```json
{
  "prompt": "Change hair color to blonde",
  "imageData": "base64-encoded-image",
  "conversationId": "optional-conversation-id",
  "preserveIdentity": true
}
```

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "imageData": "base64-encoded-edited-image",
  "conversationId": "conversation-id",
  "policyCheck": {
    "riskLevel": "low",
    "facesDetected": 1
  }
}
```

**Response (Policy Violation):**
```json
{
  "success": false,
  "error": "Forbidden identity manipulation detected: 'replace face'. Edits that alter, replace, or impersonate identity are not allowed.",
  "code": "policy-violation",
  "riskLevel": "high"
}
```

### POST /v1/approve-edit (Admin Only)
Manually approve a flagged edit request.

**Request:**
```json
{
  "requestId": "unique-request-id",
  "prompt": "The edit prompt",
  "imageData": "base64-encoded-image",
  "reason": "Approved because it's a legitimate artistic edit"
}
```

**Headers:**
```
Authorization: Bearer <firebase-admin-id-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "imageData": "base64-encoded-edited-image",
  "approvedBy": "admin-user-id",
  "approvedAt": "2025-11-22T10:30:00.000Z"
}
```

## Policy Rules

### ✅ Allowed Edits
- Hair color/style changes
- Makeup application
- Lighting and color grading
- Background changes
- Clothing modifications
- Accessories additions
- Photo adjustments (brightness, contrast, saturation)

### ❌ Forbidden Edits
- Face swapping or replacement
- Identity impersonation
- Facial structure changes
- Adding/removing facial features
- Celebrity face transformations
- Deepfake-style manipulations
- Drastic changes to face shape, jawline, nose, eyes

### 🔍 Detection Mechanism
1. **Keyword Analysis**: Scans prompts for forbidden terms
2. **Face Detection**: Uses Google Cloud Vision API to detect faces
3. **Risk Classification**: Assigns risk level based on edit type
4. **Cosmetic Verification**: For face edits, ensures only cosmetic changes

## Setup

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Configure Environment Variables

Create a `.env` file (based on `.env.example`):
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Set Firebase Environment Config
```bash
firebase functions:config:set gemini.api_key="your_gemini_api_key"
firebase functions:config:set gemini.endpoint="https://generativelanguage.googleapis.com"
```

### 4. Enable Required APIs
```bash
# Enable Cloud Vision API (for face detection)
gcloud services enable vision.googleapis.com

# Enable Generative Language API (for Gemini)
gcloud services enable generativelanguage.googleapis.com
```

### 5. Deploy Functions
```bash
npm run deploy
```

Or deploy specific functions:
```bash
firebase deploy --only functions:generateImage,functions:editImage,functions:approveEdit
```

## Local Development

### Run Emulator
```bash
npm run serve
```

This starts the Firebase Functions emulator at `http://localhost:5001`.

### Test Endpoints Locally
```bash
# Generate image
curl -X POST http://localhost:5001/your-project/us-central1/generateImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset"}'

# Edit image
curl -X POST http://localhost:5001/your-project/us-central1/editImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Change background to blue sky", "imageData": "BASE64_IMAGE"}'
```

## Rate Limiting

Default configuration:
- **Window**: 1 hour (3600000 ms)
- **Max Requests**: 20 per user per hour

Rate limit data is stored in Firestore at `/rateLimits/{userId}`.

To adjust limits, modify constants in `geminiProxy.ts`:
```typescript
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 20;
```

## Firestore Collections

### `/rateLimits/{userId}`
Tracks per-user request counts for rate limiting.
```json
{
  "userId": "user123",
  "requests": 5,
  "windowStart": 1700000000000
}
```

### `/auditLogs`
Comprehensive audit trail of all operations.
```json
{
  "userId": "user123",
  "action": "image-edit-success",
  "details": {
    "conversationId": "conv456",
    "riskLevel": "low",
    "facesDetected": 1
  },
  "timestamp": "2025-11-22T10:30:00.000Z"
}
```

### `/adminApprovals`
Records of manual admin approvals.
```json
{
  "adminId": "admin123",
  "requestId": "req789",
  "prompt": "Edit request details...",
  "reason": "Legitimate artistic edit",
  "timestamp": "2025-11-22T10:30:00.000Z"
}
```

### `/conversations/{conversationId}/messages`
Image references persisted to conversations.
```json
{
  "userId": "user123",
  "prompt": "Change hair color to red",
  "imageUrl": "https://...",
  "type": "image-edit",
  "timestamp": "2025-11-22T10:30:00.000Z"
}
```

## Admin Setup

To grant admin privileges to a user:

```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');
admin.initializeApp();

admin.auth().setCustomUserClaims('user-id-here', {admin: true})
  .then(() => console.log('Admin claim set successfully'));
```

Or via Firebase Console:
1. Go to Authentication → Users
2. Select user → Custom claims
3. Add: `{"admin": true}`

## Security Considerations

1. **API Key Protection**: Never commit `.env` files. Use Firebase Functions config or Secret Manager.
2. **Admin Access**: Carefully control who has admin privileges.
3. **Audit Logs**: Regularly review `/auditLogs` for suspicious activity.
4. **Rate Limits**: Adjust based on your app's needs and Gemini API quotas.
5. **Face Detection**: Requires Google Cloud Vision API which may incur costs.

## Monitoring

View logs in Firebase Console:
```bash
firebase functions:log
```

Or filter by function:
```bash
firebase functions:log --only generateImage
```

## Error Handling

The module uses Firebase HttpsError for consistent error responses:

- `unauthenticated`: Invalid or missing auth token
- `invalid-argument`: Malformed request data
- `resource-exhausted`: Rate limit exceeded
- `permission-denied`: Admin-only endpoint accessed by non-admin
- `internal`: Server-side errors (Gemini API failures, etc.)

## Cost Considerations

- **Gemini API**: Check Google's pricing for generative AI calls
- **Cloud Vision API**: Face detection API calls (per image)
- **Firebase Functions**: Invocations and compute time
- **Firestore**: Reads/writes for rate limiting and audit logs

## License

See main project LICENSE file.

## Support

For issues or questions, please open a GitHub issue in the main repository.
