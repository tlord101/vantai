# Admin & Security Quick Reference

## 🚀 Quick Commands

### Deploy Everything
```bash
# Functions
cd functions && npm run build && firebase deploy --only functions

# Firestore rules
firebase deploy --only firestore:rules

# Client
npm run build && firebase deploy --only hosting
```

### Set Admin User
```bash
# Create setAdmin.ts in functions/src/
npx ts-node functions/src/setAdmin.ts admin@example.com
```

### View Logs
```bash
# Real-time function logs
firebase functions:log --only generateImage

# Admin API logs
firebase functions:log --only getPendingOverrides
```

---

## 📡 API Endpoints

### Admin Endpoints

All require `Authorization: Bearer <ID_TOKEN>` with admin claim.

**Get Pending Overrides**
```bash
GET /v1/admin/pending-overrides
```

**Approve/Reject Override**
```bash
POST /v1/admin/approve-override
{
  "overrideId": "abc123",
  "approved": true,
  "reason": "Approved for legitimate use case"
}
```

**View Transactions**
```bash
GET /v1/admin/transactions?userId=xxx&limit=50&status=success
```

**Adjust Credits**
```bash
POST /v1/admin/adjust-credits
{
  "userId": "abc123",
  "amount": 100,
  "reason": "Refund for failed payment"
}
```

**Usage Metrics**
```bash
GET /v1/admin/usage-metrics?userId=xxx&days=30
```

**Audit Logs**
```bash
GET /v1/admin/audit-logs?userId=xxx&eventType=policy-violation&severity=warning&days=7&limit=100
```

---

## 🔐 Security Functions

### Audit Logging

**Log image generation:**
```typescript
await logImageGenerationRequest(userId, prompt, aspectRatio, {
  imageFormat: "jpeg",
  riskLevel: "low"
});
```

**Log policy violation:**
```typescript
await logPolicyViolation(
  userId,
  AuditEventType.POLICY_VIOLATION_FACE_DETECTED,
  "Face detected in edit attempt",
  { facesDetected: 2 }
);
```

**Log billing event:**
```typescript
await logBillingEvent(
  userId,
  AuditEventType.BILLING_PAYMENT_SUCCESS,
  { amount: 50000, credits: 100 }
);
```

**Log admin action:**
```typescript
await logAdminAction(
  adminUserId,
  AuditEventType.ADMIN_CREDIT_ADJUSTMENT,
  { targetUserId, amount: 50, reason: "Bonus credits" }
);
```

**Query logs:**
```typescript
const logs = await getAuditLogs({
  userId: "abc123",
  eventType: AuditEventType.IMAGE_GENERATION_REQUEST,
  severity: "warning",
  startDate: new Date("2024-01-01"),
  endDate: new Date(),
  limit: 100
});
```

**Get user summary:**
```typescript
const summary = await getUserActivitySummary(userId, 30); // Last 30 days
// Returns: { imageGenerations, policyViolations, billingEvents, adminActions }
```

### Rate Limiting

**Enforce rate limit:**
```typescript
await enforceRateLimit(
  userId,
  RATE_LIMITS.IMAGE_GENERATION,
  isAdmin // Bypass for admins
);
```

**Check status:**
```typescript
const status = await getRateLimitStatus(userId, RATE_LIMITS.IMAGE_GENERATION);
// Returns: { count, maxRequests, remaining, resetAt }
```

**Reset limit (admin):**
```typescript
await resetRateLimit(userId, RATE_LIMITS.IMAGE_GENERATION);
```

**Get all statuses:**
```typescript
const statuses = await getAllRateLimitStatuses(userId);
// Returns: { imageGeneration, imageEditing, billing }
```

### PII Sanitization

**Sanitize prompt:**
```typescript
const cleaned = sanitizePrompt(userPrompt);
// Removes: emails, phones, SSNs, credit cards, IPs
// Truncates to 500 chars
```

**Hash sensitive data:**
```typescript
const hashed = hashSensitiveData(creditCardLast4);
// SHA256 one-way hash
```

---

## 📊 Rate Limit Configuration

```typescript
const RATE_LIMITS = {
  IMAGE_GENERATION: {
    maxRequests: 10,
    windowMs: 60000  // 1 minute
  },
  IMAGE_EDITING: {
    maxRequests: 15,
    windowMs: 60000
  },
  ADMIN_API: {
    maxRequests: 100,
    windowMs: 60000
  },
  BILLING_API: {
    maxRequests: 30,
    windowMs: 60000
  }
};
```

**Update limits:**
Edit `/functions/src/rateLimiting.ts` and redeploy.

---

## 🎯 Audit Event Types

### Image Operations
- `IMAGE_GENERATION_REQUEST`
- `IMAGE_GENERATION_SUCCESS`
- `IMAGE_GENERATION_FAILURE`
- `IMAGE_EDITING_REQUEST`
- `IMAGE_EDITING_SUCCESS`
- `IMAGE_EDITING_FAILURE`

### Policy Violations
- `POLICY_VIOLATION_FACE_DETECTED`
- `POLICY_VIOLATION_INAPPROPRIATE_CONTENT`
- `POLICY_VIOLATION_IDENTITY_CHANGE`

### Billing
- `BILLING_PAYMENT_INITIATED`
- `BILLING_PAYMENT_SUCCESS`
- `BILLING_PAYMENT_FAILURE`
- `BILLING_SUBSCRIPTION_CREATED`
- `BILLING_SUBSCRIPTION_CANCELLED`
- `BILLING_CREDITS_PURCHASED`
- `BILLING_CREDITS_CONSUMED`
- `BILLING_REFUND_PROCESSED`

### Admin Actions
- `ADMIN_ACCESSED_LOGS`
- `ADMIN_CREDIT_ADJUSTMENT`
- `ADMIN_EDIT_OVERRIDE`
- `ADMIN_USER_SUSPENSION`
- `ADMIN_SETTINGS_CHANGED`

### Security
- `SECURITY_RATE_LIMIT_EXCEEDED`
- `SECURITY_UNAUTHORIZED_ACCESS`
- `SECURITY_TOKEN_VERIFICATION_FAILED`
- `SECURITY_SUSPICIOUS_ACTIVITY`

---

## 🗃️ Firestore Collections

### `/audit_logs`
Main audit log collection.

**Schema:**
```typescript
{
  eventType: string,
  userId: string,
  action: string,
  metadata: object,
  severity: "info" | "warning" | "error" | "critical",
  status: "success" | "failure" | "pending",
  timestamp: Timestamp,
  ipAddress?: string,
  userAgent?: string
}
```

### `/audit_logs_image`
Image-specific operations.

### `/audit_logs_policy`
Policy violations only.

### `/audit_logs_billing`
Billing events only.

### `/audit_logs_admin`
Admin actions only.

### `/rate_limits/{userId}`
Rate limit counters.

**Schema:**
```typescript
{
  count: number,
  windowStart: Timestamp,
  resetAt: Timestamp
}
```

### `/pending_overrides/{overrideId}`
Manual edit override requests.

**Schema:**
```typescript
{
  userId: string,
  prompt: string,
  reason: string,
  status: "pending" | "approved" | "rejected",
  requestedAt: Timestamp,
  approvedBy?: string,
  approvedAt?: Timestamp,
  rejectionReason?: string
}
```

---

## 🔧 Firestore Security Rules

```javascript
// Admin-only collections
match /audit_logs/{logId} {
  allow read: if request.auth.token.admin == true;
  allow write: if false; // Server-side only
}

match /pending_overrides/{overrideId} {
  allow create: if request.auth != null;
  allow read: if request.auth.uid == resource.data.userId ||
                 request.auth.token.admin == true;
  allow update, delete: if request.auth.token.admin == true;
}

// User-specific with admin bypass
match /billing/{docId} {
  allow read: if request.auth.uid == resource.data.userId ||
                 request.auth.token.admin == true;
  allow write: if false; // Server-side only
}
```

---

## 🎨 Admin Dashboard Routes

### `/admin`
Main admin dashboard (requires admin claim).

**Tabs:**
1. **Audit Logs** - View system logs
2. **Pending Overrides** - Approve/reject edit requests
3. **Transactions** - Billing history
4. **Usage Metrics** - Analytics
5. **Credits Management** - Adjust user credits

**Access control:**
```typescript
const {currentUser, isAdmin} = useAuth();

if (!currentUser) return <Navigate to="/login" />;
if (!isAdmin) return <div>Access Denied</div>;
```

---

## 🔑 Environment Variables

### Functions (.env in /functions/)
```bash
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx
GEMINI_API_KEY=AIzaSyXxx
```

### Client (.env in root/)
```bash
VITE_FIREBASE_API_KEY=AIzaSyXxx
VITE_FIREBASE_AUTH_DOMAIN=yourapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxx
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-yourproject.cloudfunctions.net
```

**Alternative:** Use Firebase Functions config
```bash
firebase functions:config:set paystack.secret_key="sk_live_xxx"
firebase functions:config:set gemini.api_key="AIzaSyXxx"
```

---

## 🧪 Testing

### Test Admin Claim
```typescript
import {auth} from "./lib/firebase";

auth.currentUser?.getIdTokenResult().then(result => {
  console.log("Admin:", result.claims.admin);
});
```

### Test Rate Limit
```bash
# Rapid fire requests
for i in {1..15}; do
  curl -X POST https://your-functions-url/generateImage \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"prompt":"test","aspectRatio":"1:1"}'
done
```

Should see rate limit error after 10th request.

### Test Audit Logging
```typescript
// In Cloud Functions
await logAuditEvent(
  AuditEventType.IMAGE_GENERATION_REQUEST,
  "test-user-id",
  "Test log entry",
  { test: true }
);

// Query Firestore
const logs = await db.collection("audit_logs")
  .where("userId", "==", "test-user-id")
  .get();
```

---

## 📈 Monitoring Queries

### Critical Events (Last 24h)
```typescript
const critical = await getAuditLogs({
  severity: "critical",
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
});
```

### Policy Violations (Last 7 days)
```typescript
const violations = await getAuditLogs({
  eventType: AuditEventType.POLICY_VIOLATION_FACE_DETECTED,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
});
```

### Failed Payments (Last 30 days)
```typescript
const failed = await getAuditLogs({
  eventType: AuditEventType.BILLING_PAYMENT_FAILURE,
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
});
```

### User Activity Summary
```typescript
const summary = await getUserActivitySummary("user-id", 30);
console.log(`Generations: ${summary.imageGenerations}`);
console.log(`Violations: ${summary.policyViolations}`);
console.log(`Billing: ${summary.billingEvents}`);
```

---

## 🐛 Common Issues

### Admin claim not working
**Fix:** User must sign out and back in after claim is set.
```typescript
await admin.auth().setCustomUserClaims(userId, { admin: true });
// User must re-authenticate
```

### Rate limit not resetting
**Fix:** Check resetAt timestamp and wait for window to expire.
```typescript
const status = await getRateLimitStatus(userId, RATE_LIMITS.IMAGE_GENERATION);
console.log("Resets at:", status.resetAt);
```

### Audit logs not appearing
**Fix:** Check Firestore security rules allow server writes.
```javascript
match /audit_logs/{logId} {
  allow write: if false; // Server-side only - this is correct
}
```
Server writes bypass security rules.

### PII still in logs
**Fix:** Ensure `sanitizePrompt()` called before logging.
```typescript
await logAuditEvent(
  eventType,
  userId,
  action,
  { prompt: sanitizePrompt(prompt) } // ✅ Sanitized
);
```

---

## 📞 Quick Links

- [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) - Full security documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment procedures
- [ADMIN_IMPLEMENTATION_SUMMARY.md](./ADMIN_IMPLEMENTATION_SUMMARY.md) - Implementation overview
- [env.example](./env.example) - Environment templates

**External:**
- [Firebase Console](https://console.firebase.google.com)
- [Paystack Dashboard](https://dashboard.paystack.com)
- [Google AI Studio](https://makersuite.google.com)
