/**
 * Minimal Express handlers for recording referral clicks and signups.
 * Deploy as a Firebase Function or run on your server.
 */

const express = require('express');
const admin = require('firebase-admin');

if (!admin.apps.length) {
	// In Cloud Functions the service account is available automatically.
	// Locally set GOOGLE_APPLICATION_CREDENTIALS env to a service account JSON.
	admin.initializeApp();
}

const app = express();
app.use(express.json());

const APP_ID = 'nano-banana-v1';
const REFERRALS_PATH = (userId) => admin.firestore().collection('artifacts').doc(APP_ID).collection('referrals').doc(userId);

// helper: find referral doc by code
async function findReferralByCode(code) {
	const refsCol = admin.firestore().collection('artifacts').doc(APP_ID).collection('referrals');
	const q = await refsCol.where('code', '==', code).limit(1).get();
	if (q.empty) return null;
	const doc = q.docs[0];
	return { id: doc.id, ref: doc.ref, data: doc.data() };
}

// GET /r?ref=CODE  -> record click then redirect
app.get('/r', async (req, res) => {
	const code = String(req.query.ref || '').trim();
	if (!code) return res.status(400).send('missing ref');

	try {
		const found = await findReferralByCode(code);
		if (found) {
			await found.ref.update({
				clicks: admin.firestore.FieldValue.increment(1),
				clickHistory: admin.firestore.FieldValue.arrayUnion(new Date().toISOString()),
				updatedAt: admin.firestore.FieldValue.serverTimestamp()
			});
		}
		// Always redirect (adjust target URL as needed)
		return res.redirect(302, '/');
	} catch (err) {
		console.error('Error recording click', err);
		return res.redirect(302, '/');
	}
});

// POST /signup-record  -> record signup (call this from your signup completion)
app.post('/signup-record', async (req, res) => {
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

		// Optionally add referred user record
		if (userId) {
			await found.ref.collection('referred').doc(userId).set({
				userId,
				email: email || null,
				date: admin.firestore.FieldValue.serverTimestamp(),
				status: status || 'signup'
			}, { merge: true });
		}

		return res.json({ ok: true });
	} catch (err) {
		console.error('Error recording signup', err);
		return res.status(500).json({ error: 'internal' });
	}
});

// Export for Cloud Functions or start standalone server
module.exports = app;

if (require.main === module) {
	const port = process.env.PORT || 5000;
	app.listen(port, () => console.log(`Referral handler listening on port ${port}`));
}
