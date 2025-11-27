/**
 * Minimal Express handlers for recording referral clicks and signups.
 * Deploy as a Firebase Function or run on your server.
 */

const express = require('express');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  // For local dev, ensure GOOGLE_APPLICATION_CREDENTIALS is set to a service account JSON.
  admin.initializeApp();
}

const app = express();
app.use(express.json());

const APP_ID = 'nano-banana-v1';

// helper: find referral doc by code
async function findReferralByCode(code) {
  const refsCol = admin.firestore().collection('artifacts').doc(APP_ID).collection('referrals');
  const q = await refsCol.where('code', '==', code).limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
}

// POST /api/track-referral
// body: { refCode: string, dest?: string }
// records a click and returns { ok: true, redirect: dest || '/' }
app.post('/api/track-referral', async (req, res) => {
  const { refCode, dest } = req.body || {};
  if (!refCode) return res.status(400).json({ error: 'missing refCode' });

  try {
    const found = await findReferralByCode(String(refCode));
    if (found) {
      await found.ref.update({
        clicks: admin.firestore.FieldValue.increment(1),
        clickHistory: admin.firestore.FieldValue.arrayUnion(new Date().toISOString()),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      // Optionally log
      console.log(`Recorded click for ${found.id} (code=${refCode})`);
    } else {
      console.warn(`Referral code not found: ${refCode}`);
    }

    return res.json({ ok: true, redirect: dest || '/' });
  } catch (err) {
    console.error('Error recording click', err);
    return res.status(500).json({ error: 'internal' });
  }
});

// POST /api/track-signup
// body: { refCode: string, email?: string, userId?: string, status?: string }
app.post('/api/track-signup', async (req, res) => {
  const { refCode, email, userId, status } = req.body || {};
  if (!refCode) return res.status(400).json({ error: 'missing refCode' });

  try {
    const found = await findReferralByCode(String(refCode));
    if (!found) return res.status(404).json({ error: 'referral not found' });

    await found.ref.update({
      signups: admin.firestore.FieldValue.increment(1),
      signupHistory: admin.firestore.FieldValue.arrayUnion(new Date().toISOString()),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (userId) {
      await found.ref.collection('referred').doc(userId).set({
        userId,
        email: email || null,
        date: admin.firestore.FieldValue.serverTimestamp(),
        status: status || 'signup'
      }, { merge: true });
    }

    console.log(`Recorded signup for ${found.id} (code=${refCode})`);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error recording signup', err);
    return res.status(500).json({ error: 'internal' });
  }
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Referral handler listening on port ${port}`));
}
