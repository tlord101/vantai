// Referral Tracking Module for Vant AI
// This module handles tracking of referral clicks, signups, and successful purchases

const ReferralTracker = {
    APP_ID: "nano-banana-v1",
    REWARD_PER_REFERRAL: 1000, // ₦1000 per successful referral

    // Initialize referral tracking
    init: function(db) {
        this.db = db;
        this.checkReferralCode();
    },

    // Check if there's a referral code in URL
    checkReferralCode: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
            // Store referral code in localStorage
            localStorage.setItem('vantai_referral_code', refCode);
            
            // Track click
            this.trackClick(refCode);
            
            // Clean URL (optional - removes ref parameter)
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    },

    // Track referral link click
    trackClick: async function(refCode) {
        try {
            const referrerId = await this.getReferrerIdFromCode(refCode);
            if (!referrerId) return;

            const { doc, getDoc, updateDoc, increment, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
            
            const referralDocRef = doc(this.db, 'artifacts', this.APP_ID, 'referrals', referrerId);
            const referralDoc = await getDoc(referralDocRef);
            
            if (referralDoc.exists()) {
                const now = new Date().toISOString();
                await updateDoc(referralDocRef, {
                    clicks: increment(1),
                    clickHistory: arrayUnion(now)
                });

                console.log('Referral click tracked:', refCode);
            }
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    },

    // Track user signup with referral
    trackSignup: async function(newUserId, userEmail) {
        try {
            const refCode = localStorage.getItem('vantai_referral_code');
            if (!refCode) return;

            const referrerId = await this.getReferrerIdFromCode(refCode);
            if (!referrerId || referrerId === newUserId) {
                // Don't track self-referrals
                return;
            }

            const { doc, getDoc, updateDoc, setDoc, increment, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
            
            const referralDocRef = doc(this.db, 'artifacts', this.APP_ID, 'referrals', referrerId);
            const referralDoc = await getDoc(referralDocRef);
            
            if (referralDoc.exists()) {
                const now = new Date();
                
                // Update referrer's stats
                await updateDoc(referralDocRef, {
                    signups: increment(1),
                    signupHistory: arrayUnion(now.toISOString())
                });

                // Create referred user entry
                const referredUserRef = doc(this.db, 'artifacts', this.APP_ID, 'referrals', referrerId, 'referred', newUserId);
                await setDoc(referredUserRef, {
                    userId: newUserId,
                    email: userEmail,
                    status: 'signup',
                    date: now,
                    referralCode: refCode
                });

                console.log('Referral signup tracked:', newUserId);
            }

            // Keep referral code for purchase tracking
            localStorage.setItem('vantai_signup_tracked', 'true');
        } catch (error) {
            console.error('Error tracking signup:', error);
        }
    },

    // Track successful referral (when referred user makes first purchase)
    trackPurchase: async function(userId) {
        try {
            const refCode = localStorage.getItem('vantai_referral_code');
            const signupTracked = localStorage.getItem('vantai_signup_tracked');
            
            if (!refCode || !signupTracked) return;

            // Check if purchase already tracked
            const purchaseTracked = localStorage.getItem('vantai_purchase_tracked');
            if (purchaseTracked) return;

            const referrerId = await this.getReferrerIdFromCode(refCode);
            if (!referrerId || referrerId === userId) return;

            const { doc, getDoc, updateDoc, increment, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
            
            const referralDocRef = doc(this.db, 'artifacts', this.APP_ID, 'referrals', referrerId);
            const referralDoc = await getDoc(referralDocRef);
            
            if (referralDoc.exists()) {
                const now = new Date();
                
                // Update referrer's stats
                await updateDoc(referralDocRef, {
                    successful: increment(1),
                    earnings: increment(this.REWARD_PER_REFERRAL),
                    successHistory: arrayUnion(now.toISOString())
                });

                // Update referred user entry to successful status
                const referredUserRef = doc(this.db, 'artifacts', this.APP_ID, 'referrals', referrerId, 'referred', userId);
                await updateDoc(referredUserRef, {
                    status: 'successful',
                    purchaseDate: now
                });

                // Award referrer with Naira credit (you can implement your own reward system)
                // For example, add to their wallet or send notification
                await this.rewardReferrer(referrerId, this.REWARD_PER_REFERRAL);

                console.log('Successful referral tracked:', userId, 'Reward: ₦' + this.REWARD_PER_REFERRAL);
                
                // Mark purchase as tracked
                localStorage.setItem('vantai_purchase_tracked', 'true');
            }
        } catch (error) {
            console.error('Error tracking purchase:', error);
        }
    },

    // Reward referrer (implement your own reward logic)
    rewardReferrer: async function(referrerId, amount) {
        try {
            const { doc, getDoc, updateDoc, increment } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
            
            // Add reward to referrer's wallet/balance
            const balanceRef = doc(this.db, 'artifacts', this.APP_ID, 'users', referrerId, 'account', 'balance');
            const balanceDoc = await getDoc(balanceRef);
            
            if (balanceDoc.exists()) {
                // You could add a wallet balance or credits here
                await updateDoc(balanceRef, {
                    referralEarnings: increment(amount)
                });
            }

            console.log('Referrer rewarded:', referrerId, 'Amount: ₦' + amount);
        } catch (error) {
            console.error('Error rewarding referrer:', error);
        }
    },

    // Decode referral code to get user ID (kept for backward compatibility)
    decodeReferralCode: function(code) {
        // This function is deprecated, use getReferrerIdFromCode instead
        return null;
    },

    // Helper: Get referrer ID from code (requires Firebase query)
    getReferrerIdFromCode: async function(refCode) {
        try {
            const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
            
            const referralsRef = collection(this.db, 'artifacts', this.APP_ID, 'referrals');
            const q = query(referralsRef, where('code', '==', refCode));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                return snapshot.docs[0].id;
            }
            return null;
        } catch (error) {
            console.error('Error getting referrer ID:', error);
            return null;
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReferralTracker;
}
