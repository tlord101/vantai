/**
 * Set Admin Custom Claim
 * 
 * This script sets the admin custom claim for a user.
 * Run this locally with Firebase Admin SDK to grant admin privileges.
 * 
 * Usage:
 *   npx ts-node setAdmin.ts user@example.com
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

async function setAdminClaim(email: string): Promise<void> {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set admin custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`✅ Admin claim set for ${email}`);
    console.log(`   User ID: ${user.uid}`);
    console.log(`   User must sign out and back in for claim to take effect.`);
    
    // Verify claim was set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log(`   Custom claims:`, updatedUser.customClaims);
    
  } catch (error: any) {
    console.error(`❌ Failed to set admin claim:`, error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error("Usage: npx ts-node setAdmin.ts user@example.com");
  process.exit(1);
}

// Run the function
setAdminClaim(email).then(() => {
  console.log("\n✅ Done!");
  process.exit(0);
});
