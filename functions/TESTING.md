# Gemini Proxy Testing Guide

## Overview

This guide covers testing the Gemini image proxy endpoints locally and in production.

## Prerequisites

- Firebase CLI installed and logged in
- Node.js 18+ installed
- Valid Firebase ID token for authentication
- Test images in base64 format

## Local Testing Setup

### 1. Start Functions Emulator

```bash
cd functions
npm run serve
```

This starts the emulator at `http://localhost:5001/{project-id}/{region}/functionName`.

Example:
```
http://localhost:5001/vantai-dev/us-central1/generateImage
```

### 2. Get Firebase ID Token

Use Firebase Auth in your web app or get token programmatically:

```javascript
import { getAuth } from 'firebase/auth';

async function getIdToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    console.log('ID Token:', token);
    return token;
  }
}
```

## Test Cases

### Test 1: Generate Image (Success)

```bash
curl -X POST http://localhost:5001/vantai-dev/us-central1/generateImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset with purple skies",
    "conversationId": "test-conv-001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "imageData": "base64-encoded-image-or-url",
  "conversationId": "test-conv-001"
}
```

### Test 2: Edit Image - Allowed Cosmetic Change

```bash
curl -X POST http://localhost:5001/vantai-dev/us-central1/editImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Change hair color to blonde and add subtle makeup",
    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "conversationId": "test-conv-002",
    "preserveIdentity": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "imageData": "base64-encoded-edited-image",
  "conversationId": "test-conv-002",
  "policyCheck": {
    "riskLevel": "low",
    "facesDetected": 1
  }
}
```

### Test 3: Edit Image - Policy Violation (Identity Change)

```bash
curl -X POST http://localhost:5001/vantai-dev/us-central1/editImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Replace face with a celebrity face",
    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "preserveIdentity": true
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Forbidden identity manipulation detected: 'replace face'. Edits that alter, replace, or impersonate identity are not allowed.",
  "code": "policy-violation",
  "riskLevel": "high"
}
```

### Test 4: Edit Image - Policy Violation (Facial Structure)

```bash
curl -X POST http://localhost:5001/vantai-dev/us-central1/editImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Change face shape to make it more oval",
    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "preserveIdentity": true
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "High-risk facial structure modification detected: 'change face shape'. Edits must preserve facial structure and proportions.",
  "code": "policy-violation",
  "riskLevel": "high"
}
```

### Test 5: Rate Limit Exceeded

Make 21 requests rapidly (more than RATE_LIMIT_MAX_REQUESTS):

```bash
for i in {1..21}; do
  curl -X POST http://localhost:5001/vantai-dev/us-central1/generateImage \
    -H "Authorization: Bearer YOUR_ID_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Test image '$i'"}' &
done
wait
```

**Expected Response (21st request):**
```json
{
  "error": "Rate limit exceeded. Try again after 2025-11-22T11:30:00.000Z",
  "code": "resource-exhausted"
}
```

### Test 6: Invalid Authentication

```bash
curl -X POST http://localhost:5001/vantai-dev/us-central1/generateImage \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test image"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid authentication token",
  "code": "unauthenticated"
}
```

### Test 7: Missing Required Fields

```bash
curl -X POST http://localhost:5001/vantai-dev/us-central1/generateImage \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "error": "Valid prompt is required",
  "code": "invalid-argument"
}
```

### Test 8: Admin Approval (Admin User)

```bash
curl -X POST http://localhost:5001/vantai-dev/us-central1/approveEdit \
  -H "Authorization: Bearer ADMIN_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "req-12345",
    "prompt": "Change hair to blue (admin override)",
    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "reason": "Approved for artistic purposes"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "imageData": "base64-encoded-edited-image",
  "approvedBy": "admin-user-id",
  "approvedAt": "2025-11-22T10:30:00.000Z"
}
```

### Test 9: Admin Approval (Non-Admin User)

```bash
curl -X POST http://localhost:5001/vantai-dev/us-central1/approveEdit \
  -H "Authorization: Bearer REGULAR_USER_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "req-12345",
    "prompt": "Test",
    "imageData": "...",
    "reason": "Test"
  }'
```

**Expected Response:**
```json
{
  "error": "Only administrators can approve edit requests",
  "code": "permission-denied"
}
```

## Automated Test Script

Create `test-endpoints.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:5001/vantai-dev/us-central1"
ID_TOKEN="your-test-id-token"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== Testing Gemini Proxy Endpoints ==="

# Test 1: Generate Image
echo -e "\n${GREEN}Test 1: Generate Image${NC}"
curl -X POST "$BASE_URL/generateImage" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Test 2: Edit Image (Allowed)
echo -e "\n${GREEN}Test 2: Edit Image - Allowed${NC}"
curl -X POST "$BASE_URL/editImage" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Change background to beach", "imageData": "base64data"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Test 3: Edit Image (Denied)
echo -e "\n${GREEN}Test 3: Edit Image - Policy Violation${NC}"
curl -X POST "$BASE_URL/editImage" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Replace face with someone else", "imageData": "base64data"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Test 4: Invalid Token
echo -e "\n${GREEN}Test 4: Invalid Authentication${NC}"
curl -X POST "$BASE_URL/generateImage" \
  -H "Authorization: Bearer INVALID" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n=== Tests Complete ==="
```

Run tests:
```bash
chmod +x test-endpoints.sh
./test-endpoints.sh
```

## Firestore Verification

After running tests, check Firestore collections:

### Rate Limits
```javascript
// Check rate limit for a user
const rateLimitDoc = await db.collection('rateLimits').doc('user-id').get();
console.log(rateLimitDoc.data());
// Expected: { userId, requests: number, windowStart: timestamp }
```

### Audit Logs
```javascript
// Check recent audit logs
const logs = await db.collection('auditLogs')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();

logs.forEach(doc => {
  console.log(doc.data());
});
// Expected: Various action logs (image-generation-request, policy-violation, etc.)
```

### Admin Approvals
```javascript
// Check admin approvals
const approvals = await db.collection('adminApprovals')
  .orderBy('timestamp', 'desc')
  .limit(5)
  .get();

approvals.forEach(doc => {
  console.log(doc.data());
});
```

## Performance Testing

### Load Test with Apache Bench

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test
ab -n 100 -c 10 -p payload.json -T application/json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/vantai-dev/us-central1/generateImage
```

### Monitor Memory and CPU

While functions are running:
```bash
# Watch function logs
firebase functions:log --follow

# Check for memory warnings or timeouts
```

## Production Testing

When testing in production:

1. **Use Production URLs:**
   ```
   https://us-central1-your-project.cloudfunctions.net/generateImage
   ```

2. **Monitor Costs:**
   - Check Google Cloud Console → Billing
   - Watch Gemini API usage
   - Monitor Cloud Vision API calls

3. **Check Logs:**
   ```bash
   firebase functions:log --production
   ```

## Testing Checklist

- [ ] Authentication works correctly
- [ ] Rate limiting enforces limits
- [ ] Policy checks block forbidden edits
- [ ] Policy checks allow cosmetic edits
- [ ] Face detection identifies faces
- [ ] Gemini API integration works
- [ ] Images persist to Firestore conversations
- [ ] Audit logs are created for all actions
- [ ] Admin approval endpoint works
- [ ] Non-admins cannot access admin endpoint
- [ ] Error handling returns appropriate codes
- [ ] CORS headers are set correctly
- [ ] Large images are handled properly
- [ ] Prompt validation works
- [ ] Functions complete within timeout

## Troubleshooting Tests

### Functions Not Found
```bash
# Verify functions are deployed
firebase functions:list

# Rebuild and restart emulator
cd functions
npm run build
npm run serve
```

### Token Issues
```bash
# Verify token in JWT debugger: https://jwt.io
# Check token hasn't expired (exp claim)
# Ensure token is from correct Firebase project
```

### Emulator Issues
```bash
# Clear emulator data
firebase emulators:export ./backup
rm -rf ~/.config/firebase/emulator_data

# Restart with clean state
npm run serve
```

## Next Steps

After successful testing:
1. Deploy to production: `firebase deploy --only functions`
2. Test production endpoints with real tokens
3. Monitor for 24 hours
4. Review audit logs
5. Adjust rate limits if needed
