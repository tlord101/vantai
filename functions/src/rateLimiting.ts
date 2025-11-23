/**
 * Rate Limiting System
 * 
 * Configurable rate limiting for API endpoints to prevent abuse.
 * Uses Firestore for distributed rate limiting across multiple function instances.
 * 
 * Features:
 * - Per-user rate limits
 * - Per-IP rate limits
 * - Configurable time windows
 * - Automatic cleanup
 * - Admin bypass
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {logAuditEvent, AuditEventType} from "./auditLogging";

const db = admin.firestore();

/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  keyPrefix: string;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  IMAGE_GENERATION: {
    maxRequests: 18, // Gemini-3-pro-image: 20 RPM (leaving 2 for safety)
    windowMs: 60 * 1000, // per minute
    keyPrefix: "rate_limit_image_gen",
  } as RateLimitConfig,

  IMAGE_EDITING: {
    maxRequests: 18, // Gemini-3-pro-image: 20 RPM (leaving 2 for safety)
    windowMs: 60 * 1000, // per minute
    keyPrefix: "rate_limit_image_edit",
  } as RateLimitConfig,

  ADMIN_API: {
    maxRequests: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
    keyPrefix: "rate_limit_admin",
  } as RateLimitConfig,

  BILLING_API: {
    maxRequests: 30, // 30 requests
    windowMs: 60 * 1000, // per minute
    keyPrefix: "rate_limit_billing",
  } as RateLimitConfig,
};

/**
 * Rate limit entry interface
 */
interface RateLimitEntry {
  count: number;
  resetAt: admin.firestore.Timestamp;
  firstRequest: admin.firestore.Timestamp;
}

/**
 * Check and update rate limit
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig,
  adminBypass = false
): Promise<{allowed: boolean; resetAt: Date | null; remaining: number}> {
  // Admin users bypass rate limits
  if (adminBypass) {
    return {allowed: true, resetAt: null, remaining: 999};
  }

  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowMs);
  const key = `${config.keyPrefix}_${userId}`;
  const docRef = db.collection("rate_limits").doc(key);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        // First request - create new entry
        const entry: RateLimitEntry = {
          count: 1,
          resetAt: admin.firestore.Timestamp.fromDate(resetAt),
          firstRequest: admin.firestore.Timestamp.now(),
        };
        transaction.set(docRef, entry);
        return {allowed: true, resetAt, remaining: config.maxRequests - 1};
      }

      const data = doc.data() as RateLimitEntry;
      const resetTime = data.resetAt.toDate();

      // Check if window has expired
      if (now >= resetTime) {
        // Reset window
        const entry: RateLimitEntry = {
          count: 1,
          resetAt: admin.firestore.Timestamp.fromDate(resetAt),
          firstRequest: admin.firestore.Timestamp.now(),
        };
        transaction.set(docRef, entry);
        return {allowed: true, resetAt, remaining: config.maxRequests - 1};
      }

      // Within window - check count
      if (data.count >= config.maxRequests) {
        // Rate limit exceeded
        return {
          allowed: false,
          resetAt: resetTime,
          remaining: 0,
        };
      }

      // Increment count
      transaction.update(docRef, {
        count: admin.firestore.FieldValue.increment(1),
      });

      return {
        allowed: true,
        resetAt: resetTime,
        remaining: config.maxRequests - (data.count + 1),
      };
    });

    // Log rate limit exceeded
    if (!result.allowed) {
      await logAuditEvent(
        AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
        userId,
        "Rate limit exceeded",
        {
          keyPrefix: config.keyPrefix,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          resetAt: result.resetAt,
        },
        "warning",
        "failure"
      );
    }

    return result;
  } catch (error) {
    functions.logger.error("Rate limit check failed", {error, userId, key});
    // On error, allow request but log it
    return {allowed: true, resetAt: null, remaining: 0};
  }
}

/**
 * Middleware to enforce rate limit
 */
export async function enforceRateLimit(
  userId: string,
  config: RateLimitConfig,
  isAdmin = false
): Promise<void> {
  const result = await checkRateLimit(userId, config, isAdmin);

  if (!result.allowed) {
    const retryAfter = result.resetAt ?
      Math.ceil((result.resetAt.getTime() - Date.now()) / 1000) : 60;

    throw new functions.https.HttpsError(
      "resource-exhausted",
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      {
        retryAfter,
        resetAt: result.resetAt?.toISOString(),
        maxRequests: config.maxRequests,
      }
    );
  }
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  userId: string,
  config: RateLimitConfig
): Promise<{
  count: number;
  maxRequests: number;
  remaining: number;
  resetAt: Date | null;
}> {
  const key = `${config.keyPrefix}_${userId}`;
  const docRef = db.collection("rate_limits").doc(key);
  const doc = await docRef.get();

  if (!doc.exists) {
    return {
      count: 0,
      maxRequests: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: null,
    };
  }

  const data = doc.data() as RateLimitEntry;
  const resetAt = data.resetAt.toDate();
  const now = new Date();

  // Check if window expired
  if (now >= resetAt) {
    return {
      count: 0,
      maxRequests: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: null,
    };
  }

  return {
    count: data.count,
    maxRequests: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - data.count),
    resetAt,
  };
}

/**
 * Reset rate limit for user (admin function)
 */
export async function resetRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<void> {
  const key = `${config.keyPrefix}_${userId}`;
  const docRef = db.collection("rate_limits").doc(key);
  await docRef.delete();

  functions.logger.info("Rate limit reset", {userId, keyPrefix: config.keyPrefix});
}

/**
 * Clean up expired rate limit entries (maintenance function)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const now = admin.firestore.Timestamp.now();
  const query = db.collection("rate_limits")
    .where("resetAt", "<", now)
    .limit(500); // Process in batches

  const snapshot = await query.get();
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  functions.logger.info(`Cleaned up ${snapshot.size} expired rate limits`);
  return snapshot.size;
}

/**
 * Get all rate limit statuses for a user
 */
export async function getAllRateLimitStatuses(userId: string): Promise<{
  imageGeneration: Awaited<ReturnType<typeof getRateLimitStatus>>;
  imageEditing: Awaited<ReturnType<typeof getRateLimitStatus>>;
  billing: Awaited<ReturnType<typeof getRateLimitStatus>>;
}> {
  const [imageGeneration, imageEditing, billing] = await Promise.all([
    getRateLimitStatus(userId, RATE_LIMITS.IMAGE_GENERATION),
    getRateLimitStatus(userId, RATE_LIMITS.IMAGE_EDITING),
    getRateLimitStatus(userId, RATE_LIMITS.BILLING_API),
  ]);

  return {
    imageGeneration,
    imageEditing,
    billing,
  };
}
