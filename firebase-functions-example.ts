/**
 * Example Cloud Function for managing credits and subscriptions
 * Deploy this to Firebase Cloud Functions
 * 
 * Prerequisites:
 * - Firebase Admin SDK initialized
 * - Proper authentication/authorization checks
 * - Payment provider integration (Stripe, PayPal, etc.)
 * 
 * NOTE: This file is for reference only. Move to Firebase Functions project to deploy.
 * Install: npm install firebase-functions firebase-admin
 */

// Example using Firebase Cloud Functions v2
// import { onCall, HttpsError } from 'firebase-functions/v2/https';
// import { getDatabase } from 'firebase-admin/database';
// import { getAuth } from 'firebase-admin/auth';

// Add credits to a user (server-side only)
export const addCredits = async (request: any) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { userId, amount, reason } = request.data;

  // Authorization check: Only admins or the payment system can add credits
  // Example: Check custom claims
  // const caller = await getAuth().getUser(request.auth.uid);
  const isAdmin = true; // Replace with actual check
  const isSystem = false;

  if (!isAdmin && !isSystem && request.auth.uid !== userId) {
    throw new Error('Not authorized to add credits');
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid credit amount');
  }

  // const db = getDatabase();
  // const userRef = db.ref(`users/${userId}`);

  try {
    // Get current credits
    // const snapshot = await userRef.child('credits').get();
    const currentCredits = 0;
    const newCredits = currentCredits + amount;

    // Update credits
    // await userRef.child('credits').set(newCredits);

    // Log transaction (optional)
    console.log('Transaction:', { userId, amount, reason, newCredits });

    return {
      success: true,
      newBalance: newCredits,
    };
  } catch (error) {
    console.error('Error adding credits:', error);
    throw new Error('Failed to add credits');
  }
};

// Update user subscription (server-side only)
export const updateSubscription = async (request: any) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { userId, plan, status, endDate } = request.data;

  // Authorization check: Only system/payment webhook can update subscriptions
  const isSystem = false; // Replace with actual check

  if (!isSystem) {
    throw new Error('Only system can update subscriptions');
  }

  const validPlans = ['free', 'premium', 'enterprise'];
  const validStatuses = ['active', 'inactive', 'cancelled'];

  if (!validPlans.includes(plan) || !validStatuses.includes(status)) {
    throw new Error('Invalid plan or status');
  }

  // const db = getDatabase();
  // const subscriptionRef = db.ref(`users/${userId}/subscription`);

  try {
    console.log('Updating subscription:', { userId, plan, status, endDate });
    // await subscriptionRef.set({
    //   plan,
    //   status,
    //   startDate: Date.now(),
    //   endDate: endDate || null,
    // });

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
};

// Deduct credits (for usage tracking)
export const deductCredits = async (request: any) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { amount, action } = request.data;
  const userId = request.auth.uid;

  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid credit amount');
  }

  // const db = getDatabase();
  // const userRef = db.ref(`users/${userId}`);

  try {
    // Use transaction to prevent race conditions
    // const result = await userRef.child('credits').transaction((currentCredits: number | null) => {
    //   if (currentCredits === null) return 0;
    //   if (currentCredits < amount) return; // Abort transaction
    //   return currentCredits - amount;
    // });

    // if (!result.committed) {
    //   throw new Error('Insufficient credits');
    // }

    // Log usage
    console.log('Usage logged:', { userId, action, amount });

    return {
      success: true,
      remainingCredits: 0,
    };
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw new Error('Failed to deduct credits');
  }
};

/*
 * DEPLOYMENT INSTRUCTIONS:
 * ========================
 * 
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Initialize functions: firebase init functions
 * 3. Copy this code to functions/src/index.ts
 * 4. Deploy: firebase deploy --only functions
 * 
 * 5. Set up custom claims for admin users:
 *    const admin = require('firebase-admin');
 *    await admin.auth().setCustomUserClaims(adminUid, { admin: true });
 * 
 * 6. For payment webhooks, create a service account:
 *    await admin.auth().setCustomUserClaims(serviceAccountUid, { system: true });
 */
