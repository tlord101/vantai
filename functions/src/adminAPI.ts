/**
 * Admin API Endpoints
 * 
 * Protected admin endpoints for managing users, credits, audit logs,
 * and manual edit overrides.
 * 
 * Security:
 * - All endpoints require Firebase ID token verification
 * - Admin custom claim required (admin: true)
 * - Rate limited
 * - All actions logged to audit trail
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  logAuditEvent,
  AuditEventType,
  getAuditLogs,
  getUserActivitySummary,
} from "./auditLogging";
import {enforceRateLimit, RATE_LIMITS, getAllRateLimitStatuses} from "./rateLimiting";

const db = admin.firestore();

/**
 * Verify admin privileges
 */
async function verifyAdmin(authHeader: string | undefined): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Missing authentication"
    );
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  
  // Check admin custom claim
  if (!decodedToken.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin privileges required"
    );
  }

  return decodedToken.uid;
}

/**
 * GET /v1/admin/pending-overrides
 * Get list of pending manual edit override requests
 */
export const getPendingOverrides = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const adminUserId = await verifyAdmin(req.headers.authorization);
    await enforceRateLimit(adminUserId, RATE_LIMITS.ADMIN_API, true);

    // Log admin action
    await logAuditEvent(
      AuditEventType.ADMIN_ACCESSED_LOGS,
      adminUserId,
      "Accessed pending overrides",
      {}
    );

    // Get pending overrides from Firestore
    const snapshot = await db.collection("pending_overrides")
      .where("status", "==", "pending")
      .orderBy("requestedAt", "desc")
      .limit(50)
      .get();

    const overrides = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({overrides});
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({error: error.message});
    } else {
      functions.logger.error("Failed to get pending overrides", {error});
      res.status(500).json({error: "Internal server error"});
    }
  }
});

/**
 * POST /v1/admin/approve-override
 * Approve or reject a manual edit override
 */
export const approveOverride = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const adminUserId = await verifyAdmin(req.headers.authorization);
    await enforceRateLimit(adminUserId, RATE_LIMITS.ADMIN_API, true);

    const {overrideId, approved, reason} = req.body;

    if (!overrideId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "overrideId is required"
      );
    }

    // Update override status
    const overrideRef = db.collection("pending_overrides").doc(overrideId);
    await overrideRef.update({
      status: approved ? "approved" : "rejected",
      approvedBy: adminUserId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason,
    });

    // Log admin action
    await logAuditEvent(
      AuditEventType.ADMIN_EDIT_OVERRIDE,
      adminUserId,
      approved ? "Approved edit override" : "Rejected edit override",
      {overrideId, reason}
    );

    res.status(200).json({
      success: true,
      overrideId,
      status: approved ? "approved" : "rejected",
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({error: error.message});
    } else {
      functions.logger.error("Failed to approve override", {error});
      res.status(500).json({error: "Internal server error"});
    }
  }
});

/**
 * GET /v1/admin/transactions
 * Get recent billing transactions with filtering
 */
export const getTransactions = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const adminUserId = await verifyAdmin(req.headers.authorization);
    await enforceRateLimit(adminUserId, RATE_LIMITS.ADMIN_API, true);

    const {userId, limit = 50, status} = req.query;

    // Log admin action
    await logAuditEvent(
      AuditEventType.ADMIN_ACCESSED_LOGS,
      adminUserId,
      "Accessed transactions",
      {userId, limit}
    );

    // Build query
    let query = db.collection("billing")
      .orderBy("timestamp", "desc")
      .limit(Number(limit));

    if (userId) {
      query = query.where("userId", "==", userId) as any;
    }

    if (status) {
      query = query.where("status", "==", status) as any;
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({transactions});
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({error: error.message});
    } else {
      functions.logger.error("Failed to get transactions", {error});
      res.status(500).json({error: "Internal server error"});
    }
  }
});

/**
 * POST /v1/admin/adjust-credits
 * Manually adjust user credits (for refunds, bonuses, etc.)
 */
export const adjustCredits = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const adminUserId = await verifyAdmin(req.headers.authorization);
    await enforceRateLimit(adminUserId, RATE_LIMITS.ADMIN_API, true);

    const {userId, amount, reason} = req.body;

    if (!userId || typeof amount !== "number") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "userId and amount are required"
      );
    }

    // Update user credits
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      credits: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log transaction
    await db.collection("billing").add({
      userId,
      type: "admin-adjustment",
      amount: 0,
      credits: amount,
      status: "success",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        adjustedBy: adminUserId,
        reason,
      },
    });

    // Log admin action
    await logAuditEvent(
      AuditEventType.ADMIN_CREDIT_ADJUSTMENT,
      adminUserId,
      "Adjusted user credits",
      {userId, amount, reason}
    );

    res.status(200).json({
      success: true,
      userId,
      adjustment: amount,
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({error: error.message});
    } else {
      functions.logger.error("Failed to adjust credits", {error});
      res.status(500).json({error: "Internal server error"});
    }
  }
});

/**
 * GET /v1/admin/usage-metrics
 * Get usage metrics for all users or specific user
 */
export const getUsageMetrics = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const adminUserId = await verifyAdmin(req.headers.authorization);
    await enforceRateLimit(adminUserId, RATE_LIMITS.ADMIN_API, true);

    const {userId, days = 30} = req.query;

    // Log admin action
    await logAuditEvent(
      AuditEventType.ADMIN_ACCESSED_LOGS,
      adminUserId,
      "Accessed usage metrics",
      {userId, days}
    );

    if (userId) {
      // Get specific user metrics
      const summary = await getUserActivitySummary(
        userId as string,
        Number(days)
      );

      const rateLimits = await getAllRateLimitStatuses(userId as string);

      res.status(200).json({
        userId,
        summary,
        rateLimits,
      });
    } else {
      // Get overall metrics
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const logs = await getAuditLogs({
        startDate,
        limit: 1000,
      });

      // Aggregate by user
      const userMetrics: Record<string, {
        imageGenerations: number;
        policyViolations: number;
        billingEvents: number;
      }> = {};

      logs.forEach((log) => {
        const data = log.data();
        const uid = data.userId;
        const eventType = data.eventType as string;

        if (!userMetrics[uid]) {
          userMetrics[uid] = {
            imageGenerations: 0,
            policyViolations: 0,
            billingEvents: 0,
          };
        }

        if (eventType.startsWith("image-")) {
          userMetrics[uid].imageGenerations++;
        } else if (eventType.startsWith("policy-violation")) {
          userMetrics[uid].policyViolations++;
        } else if (eventType.startsWith("billing-")) {
          userMetrics[uid].billingEvents++;
        }
      });

      res.status(200).json({
        metrics: userMetrics,
        totalUsers: Object.keys(userMetrics).length,
        totalLogs: logs.length,
      });
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({error: error.message});
    } else {
      functions.logger.error("Failed to get usage metrics", {error});
      res.status(500).json({error: "Internal server error"});
    }
  }
});

/**
 * GET /v1/admin/audit-logs
 * Get audit logs with filtering
 */
export const getAdminAuditLogs = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const adminUserId = await verifyAdmin(req.headers.authorization);
    await enforceRateLimit(adminUserId, RATE_LIMITS.ADMIN_API, true);

    const {
      userId,
      eventType,
      severity,
      limit = 100,
      days = 7,
    } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const logs = await getAuditLogs({
      userId: userId as string | undefined,
      eventType: eventType as any,
      severity: severity as string | undefined,
      startDate,
      limit: Number(limit),
    });

    // Log admin action
    await logAuditEvent(
      AuditEventType.ADMIN_ACCESSED_LOGS,
      adminUserId,
      "Accessed audit logs",
      {userId, eventType, severity, days}
    );

    const auditLogs = logs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      logs: auditLogs,
      count: auditLogs.length,
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({error: error.message});
    } else {
      functions.logger.error("Failed to get audit logs", {error});
      res.status(500).json({error: "Internal server error"});
    }
  }
});
