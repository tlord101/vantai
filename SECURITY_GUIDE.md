# Security Implementation Guide

## Overview

This document outlines the security measures implemented in the VanTai AI platform and best practices for maintaining a secure deployment.

## 🔐 Authentication & Authorization

### Firebase ID Token Verification

All API endpoints verify Firebase ID tokens:

```typescript
const verifyToken = async (authHeader: string) => {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpsError("unauthenticated", "Missing token");
  }
  
  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken.uid;
};
```

**Implementation locations:**
- `/functions/src/geminiProxy.ts` - Image generation/editing
- `/functions/src/paystackIntegration.ts` - Payment operations
- `/functions/src/adminAPI.ts` - Admin operations

### Admin Custom Claims

Admin users require a custom claim on their Firebase Auth token:

```typescript
// Set admin claim (run once via Firebase Admin SDK)
await admin.auth().setCustomUserClaims(userId, { admin: true });

// Verify in endpoints
if (!decodedToken.admin) {
  throw new HttpsError("permission-denied", "Admin required");
}
```

**Admin-only endpoints:**
- `getPendingOverrides` - View pending edit approvals
- `approveOverride` - Approve/reject manual edits
- `getTransactions` - View all billing transactions
- `adjustCredits` - Manually adjust user credits
- `getUsageMetrics` - View system-wide usage stats
- `getAdminAuditLogs` - Access audit logs

## 🛡️ Rate Limiting

### Distributed Rate Limiting

Uses Firestore transactions for atomic counters across Cloud Function instances:

**Configuration** (`/functions/src/rateLimiting.ts`):
```typescript
const RATE_LIMITS = {
  IMAGE_GENERATION: { maxRequests: 10, windowMs: 60000 },  // 10/min
  IMAGE_EDITING: { maxRequests: 15, windowMs: 60000 },     // 15/min
  ADMIN_API: { maxRequests: 100, windowMs: 60000 },        // 100/min
  BILLING_API: { maxRequests: 30, windowMs: 60000 },       // 30/min
};
```

**Storage:** `/rate_limits/{userId}` collection
- `count` - Current request count
- `windowStart` - Window start timestamp
- `resetAt` - When counter resets

**Admin bypass:**
```typescript
await enforceRateLimit(userId, RATE_LIMITS.IMAGE_GENERATION, isAdmin);
```

## 📋 Audit Logging

### Comprehensive Event Tracking

All operations logged to Firestore for compliance and security monitoring.

**Event types** (`/functions/src/auditLogging.ts`):
- **Image Operations:** generation-request, generation-success, generation-failure, editing-request, face-detection, policy-violation
- **Billing:** payment-initiated, payment-success, payment-failure, subscription-created, credits-purchased, credits-consumed
- **Admin:** accessed-logs, credit-adjustment, edit-override, user-suspension, settings-changed
- **Security:** rate-limit-exceeded, unauthorized-access, token-verification-failed, suspicious-activity

**Storage structure:**
```
/audit_logs              # Main log collection
/audit_logs_image        # Image-specific logs
/audit_logs_policy       # Policy violations
/audit_logs_billing      # Billing events
/audit_logs_admin        # Admin actions
```

**Log retention:** 90 days (configurable)

### PII Sanitization

All prompts sanitized before logging:

```typescript
sanitizePrompt(userPrompt);
// Removes: emails, phone numbers, SSNs, credit cards, IPs
// Truncates to 500 characters
```

**Patterns removed:**
- Email addresses: `user@example.com` → `[EMAIL]`
- Phone numbers: `+1-234-567-8900` → `[PHONE]`
- SSNs: `123-45-6789` → `[SSN]`
- Credit cards: `4111-1111-1111-1111` → `[CREDIT_CARD]`
- IP addresses: `192.168.1.1` → `[IP]`

### Sensitive Data Hashing

Use one-way hashing for sensitive identifiers:

```typescript
hashSensitiveData(creditCardLast4); // SHA256 hash
```

## 🔒 Data Encryption

### At Rest

**Firestore encryption:**
- All data encrypted at rest by Google Cloud Platform
- Customer-managed encryption keys (CMEK) available for enterprise

**Prompt storage:**
For sensitive prompts, use client-side encryption before sending:

```typescript
// Example: Encrypt prompt client-side (optional)
import {encrypt} from 'crypto-js/aes';
const encryptedPrompt = encrypt(prompt, userKey).toString();
```

### In Transit

**TLS/SSL:**
- All Firebase Functions use HTTPS
- Paystack webhooks verify HMAC SHA512 signatures
- Gemini API uses HTTPS

## 🔑 Environment Variables

### Required Secrets

Create `.env` files for each environment:

**Functions** (`/functions/.env`):
```bash
# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx

# Gemini AI
GEMINI_API_KEY=AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxX

# Firebase Admin SDK (auto-injected in Cloud Functions)
FIREBASE_CONFIG=auto
```

**Client** (`/.env`):
```bash
# Firebase Config
VITE_FIREBASE_API_KEY=AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxX
VITE_FIREBASE_AUTH_DOMAIN=yourapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx

# Paystack Public Key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx

# API Endpoints
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-yourproject.cloudfunctions.net
```

### Key Rotation

**Paystack keys:**
1. Generate new key in Paystack Dashboard
2. Update `PAYSTACK_SECRET_KEY` in Firebase Functions config
3. Deploy functions: `firebase deploy --only functions`
4. Update `VITE_PAYSTACK_PUBLIC_KEY` client-side
5. Redeploy client

**Gemini API key:**
1. Generate new key in Google AI Studio
2. Update `GEMINI_API_KEY` in Firebase Functions
3. Deploy: `firebase deploy --only functions`

**Firebase service account:**
1. Generate new service account in Firebase Console
2. Download JSON key
3. Update `GOOGLE_APPLICATION_CREDENTIALS` path
4. Redeploy functions

**Rotation schedule:** Quarterly or after suspected compromise

## 🚨 Security Monitoring

### Audit Log Queries

**Check for suspicious activity:**
```typescript
const logs = await getAuditLogs({
  severity: "critical",
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
});
```

**Monitor policy violations:**
```typescript
const violations = await getAuditLogs({
  eventType: AuditEventType.POLICY_VIOLATION_DETECTED,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7d
});
```

**Track specific user activity:**
```typescript
const summary = await getUserActivitySummary(userId, 30); // Last 30 days
```

### Firestore Security Rules

**User collection** (`/users/{userId}`):
```javascript
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

**Billing collection** (`/billing/{docId}`):
```javascript
match /billing/{docId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.userId || 
     request.auth.token.admin == true);
  allow write: if false; // Server-side only
}
```

**Audit logs** (`/audit_logs/{logId}`):
```javascript
match /audit_logs/{logId} {
  allow read: if request.auth.token.admin == true;
  allow write: if false; // Server-side only
}
```

**Admin collections:**
```javascript
match /pending_overrides/{overrideId} {
  allow read, write: if request.auth.token.admin == true;
}
```

## 🔐 Prompt Safety

### Input Sanitization

**Content filtering:**
```typescript
// Remove unsafe content before API calls
const sanitized = sanitizePrompt(userInput);

// Check for policy violations
const violatesPolicy = await checkContentPolicy(sanitized);
if (violatesPolicy) {
  await logPolicyViolation(userId, sanitized, "Blocked content");
  throw new Error("Content violates policy");
}
```

**Face detection for edits:**
```typescript
// Prevent editing images with faces
const faces = await detectFaces(imageBuffer);
if (faces.length > 0) {
  await logPolicyViolation(userId, prompt, "Face detected");
  throw new Error("Cannot edit images with faces");
}
```

### Manual Override Request

Users can request admin approval for blocked edits:

```typescript
// Store override request
await db.collection("pending_overrides").add({
  userId,
  prompt,
  reason: userExplanation,
  status: "pending",
  requestedAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

**Admin approval flow:**
1. User submits override request with explanation
2. Admin reviews in `/admin` dashboard
3. Admin approves/rejects with reason
4. System notifies user of decision

## 🛠️ Security Best Practices

### Development

1. **Never commit secrets** - Use `.gitignore` for `.env` files
2. **Use environment-specific keys** - Dev/staging/prod separation
3. **Enable 2FA** on Firebase/Paystack accounts
4. **Restrict API key permissions** - Use scoped keys when possible
5. **Review dependencies** - Run `npm audit` regularly

### Production

1. **Enable Cloud Functions VPC** - Network isolation
2. **Use Cloud Armor** - DDoS protection
3. **Set up alerts** - Monitor error rates, latency
4. **Backup Firestore** - Daily automated backups
5. **Review audit logs weekly** - Check for anomalies

### Incident Response

**If API key is compromised:**
1. Immediately rotate key in provider dashboard
2. Update Firebase Functions config
3. Deploy emergency update
4. Review audit logs for unauthorized usage
5. Check billing for unexpected charges

**If user account is compromised:**
1. Disable account: `admin.auth().updateUser(uid, {disabled: true})`
2. Review user's audit logs
3. Refund unauthorized charges
4. Force password reset on re-enable

## 📊 Compliance

### GDPR Requirements

**Data subject rights:**
- **Access:** Users can view their audit logs via API
- **Deletion:** Implement user data deletion function
- **Portability:** Export user data as JSON

**Data retention:**
- Audit logs: 90 days (configurable)
- Billing records: 7 years (tax law requirement)
- User data: Indefinite until deletion requested

### PCI DSS (Payment Card Industry)

**Compliance measures:**
- ✅ No credit card data stored (Paystack handles)
- ✅ Webhook signature verification (HMAC SHA512)
- ✅ HTTPS for all payment endpoints
- ✅ Audit logging of all payment events
- ✅ Rate limiting to prevent brute force

## 🔍 Security Checklist

**Pre-deployment:**
- [ ] All `.env` files in `.gitignore`
- [ ] Production API keys rotated from dev keys
- [ ] Firestore security rules deployed
- [ ] Rate limits configured appropriately
- [ ] Admin custom claims set for admin users
- [ ] Audit log retention configured
- [ ] Backup strategy implemented

**Post-deployment:**
- [ ] Monitor error rates in Cloud Functions logs
- [ ] Review audit logs for suspicious activity
- [ ] Set up billing alerts
- [ ] Test rate limiting behavior
- [ ] Verify webhook signature validation
- [ ] Check admin dashboard access controls

**Monthly:**
- [ ] Review audit logs for anomalies
- [ ] Check for dependency vulnerabilities (`npm audit`)
- [ ] Verify backup integrity
- [ ] Review user activity summaries
- [ ] Update security documentation

**Quarterly:**
- [ ] Rotate API keys
- [ ] Review Firestore security rules
- [ ] Penetration testing
- [ ] Update disaster recovery plan
- [ ] Security training for team

---

## 📚 Related Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment procedures
- [PAYSTACK_IMPLEMENTATION.md](./PAYSTACK_IMPLEMENTATION.md) - Payment security
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Cloud Functions Security](https://firebase.google.com/docs/functions/security)
