const admin = require('firebase-admin');

const APP_ID = 'nano-banana-v1';

function initAdmin() {
  if (admin.apps.length) return;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(svc) });
    } else {
      admin.initializeApp();
    }
  } catch (err) {
    console.error('Failed to init Firebase admin:', err);
    try { admin.initializeApp(); } catch (e) {}
  }
}

async function findReferralByCode(code) {
  const refsCol = admin.firestore().collection('artifacts').doc(APP_ID).collection('referrals');
  const q = await refsCol.where('code', '==', code).limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
}

module.exports = async (req, res) => {
  initAdmin();
  try {
    const { referralCode, newUserId, email, status } = req.body || {};
    if (!referralCode || !newUserId) return res.status(400).json({ success: false, error: 'referralCode and newUserId required' });

    const found = await findReferralByCode(String(referralCode));
    if (!found) return res.status(404).json({ success: false, error: 'referral not found' });

    await found.ref.update({
      signups: admin.firestore.FieldValue.increment(1),
      signupHistory: admin.firestore.FieldValue.arrayUnion(new Date().toISOString()),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Record referred user entry
    await found.ref.collection('referred').doc(newUserId).set({
      userId: newUserId,
      email: email || null,
      status: status || 'signup',
      date: admin.firestore.FieldValue.serverTimestamp(),
      referralCode: referralCode
    }, { merge: true });

    // Ensure new user has default Nano credits = 10
    const userBalanceRef = admin.firestore().collection('artifacts').doc(APP_ID).collection('users').doc(newUserId).collection('account').doc('balance');
    const balSnap = await userBalanceRef.get();
    if (!balSnap.exists) {
      await userBalanceRef.set({ credits: 10, email: email || null });
      console.log(`Set default credits=10 for new user ${newUserId}`);
    }

    console.log(`Recorded signup for ${found.id} (code=${referralCode})`);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error in track-signup:', err);
    return res.status(500).json({ success: false, error: err.message || 'internal' });
  }
};
