/**
 * Audit Logging System
 * 
 * Server-side audit logging for security, compliance, and debugging.
 * Logs all critical operations including image generation, policy violations,
 * billing events, and admin actions.
 * 
 * Collections:
 * - /audit_logs/{logId} - All audit events
 * - /audit_logs_image/{logId} - Image generation/editing events
 * - /audit_logs_policy/{logId} - Policy violations
 * - /audit_logs_billing/{logId} - Billing events
 * - /audit_logs_admin/{logId} - Admin actions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Audit Event Types
 */
export enum AuditEventType {
  // Image Operations
  IMAGE_GENERATION_REQUEST = "image-generation-request",
  IMAGE_GENERATION_SUCCESS = "image-generation-success",
  IMAGE_GENERATION_FAILED = "image-generation-failed",
  IMAGE_EDIT_REQUEST = "image-edit-request",
  IMAGE_EDIT_SUCCESS = "image-edit-success",
  IMAGE_EDIT_FAILED = "image-edit-failed",
  IMAGE_EDIT_APPROVED = "image-edit-approved",
  IMAGE_EDIT_REJECTED = "image-edit-rejected",

  // Policy Violations
  POLICY_VIOLATION_FACE_DETECTED = "policy-violation-face-detected",
  POLICY_VIOLATION_NSFW_DETECTED = "policy-violation-nsfw-detected",
  POLICY_VIOLATION_PROMPT_BLOCKED = "policy-violation-prompt-blocked",
  POLICY_VIOLATION_RATE_LIMIT = "policy-violation-rate-limit",

  // Billing Events
  BILLING_CREDIT_PURCHASE = "billing-credit-purchase",
  BILLING_CREDIT_ALLOCATED = "billing-credit-allocated",
  BILLING_CREDIT_CHARGED = "billing-credit-charged",
  BILLING_CREDIT_REFUND = "billing-credit-refund",
  BILLING_CREDIT_ADJUSTED = "billing-credit-adjusted",
  BILLING_SUBSCRIPTION_CREATED = "billing-subscription-created",
  BILLING_SUBSCRIPTION_CANCELLED = "billing-subscription-cancelled",
  BILLING_WEBHOOK_RECEIVED = "billing-webhook-received",
  BILLING_WEBHOOK_FAILED = "billing-webhook-failed",

  // Admin Actions
  ADMIN_CREDIT_ADJUSTMENT = "admin-credit-adjustment",
  ADMIN_USER_BANNED = "admin-user-banned",
  ADMIN_USER_UNBANNED = "admin-user-unbanned",
  ADMIN_EDIT_OVERRIDE = "admin-edit-override",
  ADMIN_POLICY_CHANGE = "admin-policy-change",
  ADMIN_ACCESSED_LOGS = "admin-accessed-logs",

  // Authentication
  AUTH_LOGIN_SUCCESS = "auth-login-success",
  AUTH_LOGIN_FAILED = "auth-login-failed",
  AUTH_LOGOUT = "auth-logout",
  AUTH_TOKEN_REFRESH = "auth-token-refresh",

  // Security
  SECURITY_SUSPICIOUS_ACTIVITY = "security-suspicious-activity",
  SECURITY_RATE_LIMIT_EXCEEDED = "security-rate-limit-exceeded",
  SECURITY_INVALID_TOKEN = "security-invalid-token",
}

/**
 * Audit Event Interface
 */
export interface AuditEvent {
  eventType: AuditEventType;
  userId: string;
  timestamp: admin.firestore.FieldValue;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource?: string;
  metadata?: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
  status: "success" | "failure" | "pending";
}

/**
 * Sanitize prompt for logging (remove sensitive information)
 */
export function sanitizePrompt(prompt: string): string {
  // Remove potential PII patterns
  let sanitized = prompt;

  // Email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[EMAIL_REDACTED]"
  );

  // Phone numbers (various formats)
  sanitized = sanitized.replace(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    "[PHONE_REDACTED]"
  );

  // Credit card patterns
  sanitized = sanitized.replace(
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    "[CARD_REDACTED]"
  );

  // SSN patterns
  sanitized = sanitized.replace(
    /\b\d{3}-\d{2}-\d{4}\b/g,
    "[SSN_REDACTED]"
  );

  // IP addresses
  sanitized = sanitized.replace(
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    "[IP_REDACTED]"
  );

  // Truncate if too long
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 497) + "...";
  }

  return sanitized;
}

/**
 * Hash sensitive data for storage (one-way)
 */
export function hashSensitiveData(data: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Log audit event to Firestore
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  severity: "info" | "warning" | "error" | "critical" = "info",
  status: "success" | "failure" | "pending" = "success"
): Promise<void> {
  try {
    // Sanitize metadata
    const sanitizedMetadata = { ...metadata };
    if (sanitizedMetadata.prompt && typeof sanitizedMetadata.prompt === "string") {
      sanitizedMetadata.promptHash = hashSensitiveData(sanitizedMetadata.prompt);
      sanitizedMetadata.prompt = sanitizePrompt(sanitizedMetadata.prompt);
    }

    const auditEvent: AuditEvent = {
      eventType,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action,
      metadata: sanitizedMetadata,
      severity,
      status,
    };

    // Write to main audit log
    await db.collection("audit_logs").add(auditEvent);

    // Write to specialized collection based on event type
    let specializedCollection: string | null = null;

    if (eventType.startsWith("image-")) {
      specializedCollection = "audit_logs_image";
    } else if (eventType.startsWith("policy-violation")) {
      specializedCollection = "audit_logs_policy";
    } else if (eventType.startsWith("billing-")) {
      specializedCollection = "audit_logs_billing";
    } else if (eventType.startsWith("admin-")) {
      specializedCollection = "audit_logs_admin";
    }

    if (specializedCollection) {
      await db.collection(specializedCollection).add(auditEvent);
    }

    // Log to Cloud Functions logger
    const logLevel = severity === "critical" || severity === "error" ? "error" :
                     severity === "warning" ? "warn" : "info";

    functions.logger[logLevel]("Audit Event", {
      eventType,
      userId,
      action,
      severity,
      status,
    });
  } catch (error) {
    functions.logger.error("Failed to log audit event", {
      error,
      eventType,
      userId,
    });
  }
}

/**
 * Log image generation request
 */
export async function logImageGenerationRequest(
  userId: string,
  prompt: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEvent(
    AuditEventType.IMAGE_GENERATION_REQUEST,
    userId,
    "Image generation requested",
    { prompt, ...metadata },
    "info",
    "pending"
  );
}

/**
 * Log image generation success
 */
export async function logImageGenerationSuccess(
  userId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEvent(
    AuditEventType.IMAGE_GENERATION_SUCCESS,
    userId,
    "Image generation successful",
    metadata,
    "info",
    "success"
  );
}

/**
 * Log image generation failure
 */
export async function logImageGenerationFailure(
  userId: string,
  error: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEvent(
    AuditEventType.IMAGE_GENERATION_FAILED,
    userId,
    "Image generation failed",
    { error, ...metadata },
    "error",
    "failure"
  );
}

/**
 * Log policy violation
 */
export async function logPolicyViolation(
  userId: string,
  violationType: AuditEventType,
  reason: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEvent(
    violationType,
    userId,
    "Policy violation detected",
    { reason, ...metadata },
    "warning",
    "failure"
  );
}

/**
 * Log billing event
 */
export async function logBillingEvent(
  userId: string,
  eventType: AuditEventType,
  amount: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEvent(
    eventType,
    userId,
    "Billing event",
    { amount, ...metadata },
    "info",
    "success"
  );
}

/**
 * Log admin action
 */
export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetUserId?: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEvent(
    AuditEventType.ADMIN_ACCESSED_LOGS,
    adminUserId,
    action,
    { targetUserId, ...metadata },
    "warning",
    "success"
  );
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    eventType?: AuditEventType;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<admin.firestore.QueryDocumentSnapshot[]> {
  let query: admin.firestore.Query = db.collection("audit_logs");

  if (filters.userId) {
    query = query.where("userId", "==", filters.userId);
  }

  if (filters.eventType) {
    query = query.where("eventType", "==", filters.eventType);
  }

  if (filters.severity) {
    query = query.where("severity", "==", filters.severity);
  }

  if (filters.startDate) {
    query = query.where("timestamp", ">=", filters.startDate);
  }

  if (filters.endDate) {
    query = query.where("timestamp", "<=", filters.endDate);
  }

  query = query.orderBy("timestamp", "desc");

  if (filters.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(100); // Default limit
  }

  const snapshot = await query.get();
  return snapshot.docs;
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(
  userId: string,
  days = 30
): Promise<{
  totalEvents: number;
  imageGenerations: number;
  policyViolations: number;
  billingEvents: number;
  lastActivity: Date | null;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await getAuditLogs({
    userId,
    startDate,
    limit: 1000,
  });

  const summary = {
    totalEvents: logs.length,
    imageGenerations: 0,
    policyViolations: 0,
    billingEvents: 0,
    lastActivity: null as Date | null,
  };

  logs.forEach((log) => {
    const data = log.data();
    const eventType = data.eventType as string;

    if (eventType.startsWith("image-")) {
      summary.imageGenerations++;
    } else if (eventType.startsWith("policy-violation")) {
      summary.policyViolations++;
    } else if (eventType.startsWith("billing-")) {
      summary.billingEvents++;
    }

    if (!summary.lastActivity && data.timestamp) {
      summary.lastActivity = data.timestamp.toDate();
    }
  });

  return summary;
}

/**
 * Clean up old audit logs (for maintenance)
 */
export async function cleanupOldAuditLogs(retentionDays = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const query = db.collection("audit_logs")
    .where("timestamp", "<", cutoffDate)
    .limit(500); // Process in batches

  const snapshot = await query.get();
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  functions.logger.info(`Cleaned up ${snapshot.size} old audit logs`);
  return snapshot.size;
}
