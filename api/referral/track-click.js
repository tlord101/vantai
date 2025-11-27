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
    const { referralCode } = req.body || {};
    if (!referralCode) return res.status(400).json({ success: false, error: 'Referral code required' });

    const found = await findReferralByCode(String(referralCode));
    if (found) {
      await found.ref.update({
        clicks: admin.firestore.FieldValue.increment(1),
        clickHistory: admin.firestore.FieldValue.arrayUnion(new Date().toISOString()),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Recorded click for ${found.id} (code=${referralCode})`);
    } else {
      console.warn('Referral code not found:', referralCode);
    }

    return res.json({ success: true, message: 'Click tracked' });
  } catch (err) {
    console.error('Error in track-click:', err);
    return res.status(500).json({ success: false, error: err.message || 'internal' });
  }
};
