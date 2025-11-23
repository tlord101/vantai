/**
 * Paystack Payment Integration
 * 
 * Server-side Paystack integration for:
 * - Subscription management
 * - Credit purchases
 * - Webhook handling
 * - Transaction reconciliation
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as crypto from "crypto";

const db = admin.firestore();

// Environment configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Credit pricing configuration
export const CREDIT_COSTS = {
  IMAGE_GENERATION: 5,    // Credits per image generation
  IMAGE_EDIT: 3,          // Credits per image edit
  ADMIN_OVERRIDE: 0,      // Admin actions are free
};

export const CREDIT_PACKAGES = [
  { id: "starter", credits: 50, price: 500, currency: "NGN", name: "Starter Pack" },
  { id: "pro", credits: 150, price: 1200, currency: "NGN", name: "Pro Pack" },
  { id: "premium", credits: 500, price: 3500, currency: "NGN", name: "Premium Pack" },
];

export const SUBSCRIPTION_PLANS = [
  {
    id: "monthly_basic",
    name: "Basic Monthly",
    credits: 100,
    price: 1000,
    currency: "NGN",
    interval: "monthly",
  },
  {
    id: "monthly_pro",
    name: "Pro Monthly",
    credits: 300,
    price: 2500,
    currency: "NGN",
    interval: "monthly",
  },
];

/**
 * Types and Interfaces
 */
interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    status: string;
    customer: {
      email: string;
      customer_code: string;
    };
    metadata?: {
      userId: string;
      packageId?: string;
      planId?: string;
      credits?: number;
    };
    subscription?: {
      subscription_code: string;
      email_token: string;
    };
  };
}

interface BillingTransaction {
  userId: string;
  type: "credit_purchase" | "subscription" | "credit_charge";
  amount: number;
  credits: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  paystackReference?: string;
  metadata?: Record<string, unknown>;
  createdAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
}

/**
 * Verify Paystack webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    functions.logger.error("PAYSTACK_SECRET_KEY not configured");
    return false;
  }

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

/**
 * Initialize Paystack transaction
 */
async function initializeTransaction(
  email: string,
  amount: number,
  metadata: Record<string, unknown>
): Promise<{ authorization_url: string; reference: string }> {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amount * 100, // Paystack expects amount in kobo (smallest currency unit)
        metadata,
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/billing/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status && response.data.data) {
      return {
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    }

    throw new Error("Failed to initialize transaction");
  } catch (error) {
    functions.logger.error("Paystack transaction initialization failed", {error});
    throw new functions.https.HttpsError(
      "internal",
      "Failed to initialize payment"
    );
  }
}

/**
 * Create subscription plan on Paystack
 */
async function createPaystackPlan(
  planId: string
): Promise<string> {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) {
    throw new Error("Invalid plan ID");
  }

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/plan`,
      {
        name: plan.name,
        amount: plan.price * 100, // In kobo
        interval: plan.interval,
        currency: plan.currency,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status && response.data.data) {
      return response.data.data.plan_code;
    }

    throw new Error("Failed to create plan");
  } catch (error: any) {
    // Plan might already exist
    if (error.response?.data?.message?.includes("already exists")) {
      functions.logger.info("Plan already exists, fetching existing plan");
      // In production, fetch and return existing plan code
      return `PLN_${planId}`;
    }
    throw error;
  }
}

/**
 * Atomically charge credits from user account
 * Returns true if successful, false if insufficient credits
 */
export async function chargeCredits(
  userId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const userRef = db.collection("users").doc(userId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User not found"
        );
      }

      const currentCredits = userDoc.data()?.credits || 0;

      if (currentCredits < amount) {
        functions.logger.warn("Insufficient credits", {
          userId,
          currentCredits,
          required: amount,
        });
        return false;
      }

      // Deduct credits
      transaction.update(userRef, {
        credits: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log transaction
      const txRef = db.collection("billing").doc();
      transaction.set(txRef, {
        userId,
        type: "credit_charge",
        amount: 0, // No monetary charge
        credits: -amount,
        currency: "NGN",
        status: "completed",
        metadata: metadata || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    });

    functions.logger.info("Credits charged successfully", {
      userId,
      amount,
      success: result,
    });

    return result;
  } catch (error) {
    functions.logger.error("Credit charging failed", {error, userId, amount});
    throw error;
  }
}

/**
 * Allocate credits to user account
 */
export async function allocateCredits(
  userId: string,
  credits: number,
  transactionData: Partial<BillingTransaction>
): Promise<void> {
  const userRef = db.collection("users").doc(userId);

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        // Create user record if doesn't exist
        transaction.set(userRef, {
          credits: credits,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Increment existing credits
        transaction.update(userRef, {
          credits: admin.firestore.FieldValue.increment(credits),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Log transaction
      const txRef = db.collection("billing").doc();
      transaction.set(txRef, {
        userId,
        credits,
        status: "completed",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...transactionData,
      });
    });

    functions.logger.info("Credits allocated successfully", {
      userId,
      credits,
    });
  } catch (error) {
    functions.logger.error("Credit allocation failed", {error, userId, credits});
    throw error;
  }
}

/**
 * POST /v1/create-subscription
 * Create a subscription plan or checkout session
 */
export const createSubscription = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Missing authentication"
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const {planId, type = "subscription"} = req.body;

    if (!planId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "planId is required"
      );
    }

    // Get user details
    const userRecord = await admin.auth().getUser(userId);
    const email = userRecord.email;

    if (!email) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "User email not found"
      );
    }

    if (type === "subscription") {
      // Create subscription plan
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid plan ID"
        );
      }

      const planCode = await createPaystackPlan(planId);

      // Initialize subscription transaction
      const {authorization_url, reference} = await initializeTransaction(
        email,
        plan.price,
        {
          userId,
          planId,
          credits: plan.credits,
          type: "subscription",
        }
      );

      // Create pending transaction record
      await db.collection("billing").doc(reference).set({
        userId,
        type: "subscription",
        amount: plan.price,
        credits: plan.credits,
        currency: plan.currency,
        status: "pending",
        paystackReference: reference,
        metadata: {planId, planCode},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        success: true,
        authorization_url,
        reference,
        plan: plan.name,
      });
    } else {
      // One-time credit purchase
      const package_ = CREDIT_PACKAGES.find((p) => p.id === planId);
      if (!package_) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid package ID"
        );
      }

      const {authorization_url, reference} = await initializeTransaction(
        email,
        package_.price,
        {
          userId,
          packageId: planId,
          credits: package_.credits,
          type: "credit_purchase",
        }
      );

      // Create pending transaction record
      await db.collection("billing").doc(reference).set({
        userId,
        type: "credit_purchase",
        amount: package_.price,
        credits: package_.credits,
        currency: package_.currency,
        status: "pending",
        paystackReference: reference,
        metadata: {packageId: planId},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        success: true,
        authorization_url,
        reference,
        package: package_.name,
      });
    }
  } catch (error) {
    functions.logger.error("Create subscription failed", {error});

    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
});

/**
 * POST /v1/paystack-webhook
 * Handle Paystack webhook events
 */
export const paystackWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    // Verify webhook signature
    const signature = req.headers["x-paystack-signature"] as string;
    const payload = JSON.stringify(req.body);

    if (!verifyWebhookSignature(payload, signature)) {
      functions.logger.error("Invalid webhook signature");
      res.status(401).json({error: "Invalid signature"});
      return;
    }

    const event: PaystackWebhookEvent = req.body;
    functions.logger.info("Webhook received", {event: event.event});

    switch (event.event) {
    case "charge.success": {
      await handleChargeSuccess(event);
      break;
    }

    case "subscription.create": {
      await handleSubscriptionCreate(event);
      break;
    }

    case "subscription.disable": {
      await handleSubscriptionDisable(event);
      break;
    }

    default:
      functions.logger.info("Unhandled webhook event", {event: event.event});
    }

    res.status(200).json({status: "success"});
  } catch (error) {
    functions.logger.error("Webhook processing failed", {error});
    res.status(500).json({error: "Webhook processing failed"});
  }
});

/**
 * Handle successful charge event
 */
async function handleChargeSuccess(event: PaystackWebhookEvent): Promise<void> {
  const {reference, amount, metadata, customer} = event.data;

  if (!metadata || !metadata.userId) {
    functions.logger.error("Missing userId in webhook metadata");
    return;
  }

  const userId = metadata.userId;
  const credits = metadata.credits || 0;

  try {
    // Check if transaction already processed (idempotency)
    const txDoc = await db.collection("billing").doc(reference).get();

    if (txDoc.exists && txDoc.data()?.status === "completed") {
      functions.logger.info("Transaction already processed", {reference});
      return;
    }

    // Allocate credits
    await allocateCredits(userId, credits, {
      userId,
      type: metadata.packageId ? "credit_purchase" : "subscription",
      amount: amount / 100, // Convert from kobo
      credits,
      currency: "NGN",
      paystackReference: reference,
      metadata: {
        customerEmail: customer.email,
        customerCode: customer.customer_code,
        ...metadata,
      },
    });

    // Update transaction status
    await db.collection("billing").doc(reference).update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info("Charge processed successfully", {
      userId,
      credits,
      reference,
    });
  } catch (error) {
    functions.logger.error("Charge processing failed", {error, reference});

    // Mark transaction as failed
    await db.collection("billing").doc(reference).update({
      status: "failed",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
}

/**
 * Handle subscription creation event
 */
async function handleSubscriptionCreate(event: PaystackWebhookEvent): Promise<void> {
  const {metadata, subscription, customer} = event.data;

  if (!metadata || !metadata.userId || !subscription) {
    functions.logger.error("Missing data in subscription webhook");
    return;
  }

  const userId = metadata.userId;

  try {
    // Store subscription details
    await db.collection("subscriptions").doc(userId).set({
      userId,
      subscriptionCode: subscription.subscription_code,
      emailToken: subscription.email_token,
      planId: metadata.planId,
      customerEmail: customer.email,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info("Subscription created", {
      userId,
      subscriptionCode: subscription.subscription_code,
    });
  } catch (error) {
    functions.logger.error("Subscription creation failed", {error});
    throw error;
  }
}

/**
 * Handle subscription disable event
 */
async function handleSubscriptionDisable(event: PaystackWebhookEvent): Promise<void> {
  const {subscription} = event.data;

  if (!subscription) {
    return;
  }

  try {
    // Find and update subscription
    const subsQuery = await db
      .collection("subscriptions")
      .where("subscriptionCode", "==", subscription.subscription_code)
      .limit(1)
      .get();

    if (!subsQuery.empty) {
      const subsDoc = subsQuery.docs[0];
      await subsDoc.ref.update({
        status: "cancelled",
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info("Subscription cancelled", {
        subscriptionCode: subscription.subscription_code,
      });
    }
  } catch (error) {
    functions.logger.error("Subscription cancellation failed", {error});
    throw error;
  }
}

/**
 * Reconcile webhooks with billing records
 * Run as scheduled function to catch any missed webhooks
 */
export async function reconcileWebhooks(): Promise<void> {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  try {
    // Find pending transactions older than 1 hour
    const pendingTxs = await db
      .collection("billing")
      .where("status", "==", "pending")
      .where("createdAt", "<", new Date(oneHourAgo))
      .limit(50)
      .get();

    functions.logger.info("Reconciling transactions", {
      count: pendingTxs.size,
    });

    for (const txDoc of pendingTxs.docs) {
      const tx = txDoc.data();
      const reference = tx.paystackReference;

      if (!reference) {
        continue;
      }

      try {
        // Verify transaction with Paystack
        const response = await axios.get(
          `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        if (response.data.status && response.data.data.status === "success") {
          // Transaction was successful but webhook was missed
          functions.logger.warn("Missed webhook detected", {reference});

          const {amount, metadata} = response.data.data;

          await allocateCredits(tx.userId, tx.credits, {
            userId: tx.userId,
            type: tx.type,
            amount: amount / 100,
            credits: tx.credits,
            currency: tx.currency,
            paystackReference: reference,
            metadata: {
              ...metadata,
              reconciled: true,
              reconciledAt: now,
            },
          });

          await txDoc.ref.update({
            status: "completed",
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              ...tx.metadata,
              reconciled: true,
            },
          });
        } else if (response.data.data.status === "failed") {
          // Transaction failed
          await txDoc.ref.update({
            status: "failed",
            metadata: {
              ...tx.metadata,
              paystackStatus: response.data.data.status,
            },
          });
        }
      } catch (error) {
        functions.logger.error("Transaction verification failed", {
          error,
          reference,
        });
      }
    }
  } catch (error) {
    functions.logger.error("Webhook reconciliation failed", {error});
    throw error;
  }
}
