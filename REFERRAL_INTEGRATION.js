/**
 * REFERRAL SYSTEM INTEGRATION GUIDE
 * =================================
 * 
 * This file demonstrates how to integrate the referral tracking system
 * into your main application.
 */

// 1. IMPORT REFERRAL TRACKER IN YOUR MAIN HTML FILE
// Add this script tag in your HTML:
// <script src="/public/referral-tracker.js"></script>

// 2. INITIALIZE WHEN FIREBASE IS READY
// After initializing Firebase, initialize the referral tracker:

/*
Example initialization code:

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Referral Tracker
ReferralTracker.init(db);

*/

// 3. TRACK SIGNUP WHEN USER CREATES ACCOUNT
// Call this after successful user registration:

/*
Example signup tracking:

async function handleSignup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Track referral signup
        await ReferralTracker.trackSignup(user.uid, email);
        
        console.log('User signed up:', user.uid);
    } catch (error) {
        console.error('Signup error:', error);
    }
}
*/

// 4. TRACK PURCHASE WHEN USER BUYS NANO CREDITS
// Call this after successful Paystack payment:

/*
Example purchase tracking:

function handlePaystackSuccess(response) {
    console.log('Payment successful:', response);
    
    // Track successful referral (only triggers if user signed up via referral)
    ReferralTracker.trackPurchase(currentUser.uid);
    
    // ... rest of your payment success logic
}

// Initialize Paystack
const handler = PaystackPop.setup({
    key: paystackPublicKey,
    email: userEmail,
    amount: amount * 100, // Amount in kobo
    currency: 'NGN',
    callback: function(response) {
        handlePaystackSuccess(response);
    },
    onClose: function() {
        console.log('Payment window closed');
    }
});
*/

// 5. ADD REFERRAL LINK TO USER NAVIGATION (OPTIONAL)
// You can add a button/link to the referral dashboard:

/*
Example HTML:

<a href="/referral.html" class="referral-link">
    <i class="icon-users"></i>
    My Referrals
</a>
*/

// THAT'S IT! The referral system is now fully integrated.
// Users can:
// 1. Share their unique referral link from /referral.html
// 2. Track clicks, signups, and earnings
// 3. Earn ₦1,000 per successful referral

/**
 * DATABASE STRUCTURE
 * ==================
 * 
 * The referral system creates the following structure in Firestore:
 * 
 * artifacts/
 *   nano-banana-v1/
 *     referrals/
 *       {userId}/
 *         - code: "ABC12345" (unique referral code)
 *         - clicks: 10 (total link clicks)
 *         - signups: 5 (total signups)
 *         - successful: 2 (successful referrals with purchase)
 *         - earnings: 2000 (total earnings in Naira)
 *         - clickHistory: ["2024-01-01T12:00:00Z", ...]
 *         - signupHistory: ["2024-01-02T15:30:00Z", ...]
 *         - successHistory: ["2024-01-03T18:45:00Z", ...]
 *         
 *         referred/
 *           {referredUserId}/
 *             - userId: "abc123"
 *             - email: "user@example.com"
 *             - status: "clicked" | "signup" | "successful"
 *             - date: Timestamp
 *             - referralCode: "ABC12345"
 *             - purchaseDate: Timestamp (only if successful)
 */

/**
 * REFERRAL LINK FORMAT
 * ====================
 * 
 * Referral links are generated as:
 * https://yourdomain.com/?ref={REFERRAL_CODE}
 * 
 * Example: https://vantai.com/?ref=ABC12345
 * 
 * When a user clicks this link:
 * 1. The referral code is stored in localStorage
 * 2. Click is tracked in database
 * 3. Code persists through signup and purchase
 */

/**
 * REWARD SYSTEM
 * =============
 * 
 * - Clicks are tracked but no reward
 * - Signups are tracked but no reward
 * - Successful referral (signup + purchase) = ₦1,000 reward
 * 
 * The reward can be:
 * - Added to user's wallet
 * - Converted to Nano credits
 * - Withdrawn as cash (implement your own withdrawal system)
 * 
 * Current implementation adds to `referralEarnings` field in user's balance document.
 */
