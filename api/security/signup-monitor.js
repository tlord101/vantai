const admin = require('firebase-admin');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return res.status(500).json({ error: 'Server not configured (missing FIREBASE_SERVICE_ACCOUNT)' });
  }

  try {
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }

    const db = admin.firestore();

    const { uid, email } = req.body || {};
    if (!uid || !email) return res.status(400).json({ error: 'Missing uid or email' });

    // Determine client IP and fingerprint (IP + User-Agent)
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';
    const crypto = require('crypto');
    const fingerprint = crypto.createHash('sha256').update(ip + '|' + ua).digest('hex');

    // Check if IP already blocked
    const ipDoc = await db.collection('security').doc('blocked_ips').collection('ips').doc(ip).get();
    if (ipDoc.exists) {
      // disable this new user
      try { await admin.auth().updateUser(uid, { disabled: true }); } catch (e) { /* ignore */ }
      return res.status(403).json({ error: 'Signup blocked from this IP' });
    }

    // Check fingerprint
    const fpRef = db.collection('security').doc('session_fingerprints').collection('fps').doc(fingerprint);
    const fpSnap = await fpRef.get();
    if (fpSnap.exists) {
      const prev = fpSnap.data();
      // If same fingerprint used by another uid/email, take action
      if (prev.uid && prev.uid !== uid) {
        // disable previous account
        try { await admin.auth().updateUser(prev.uid, { disabled: true }); } catch (e) { /* ignore */ }
        // disable current account as well
        try { await admin.auth().updateUser(uid, { disabled: true }); } catch (e) { /* ignore */ }
        // block IP
        await db.collection('security').doc('blocked_ips').collection('ips').doc(ip).set({ blockedAt: admin.firestore.FieldValue.serverTimestamp(), reason: 'multiple-signups-same-session', prevUid: prev.uid, newUid: uid, ua });
        return res.status(403).json({ error: 'Suspicious signup detected. Accounts disabled and IP blocked.' });
      } else {
        // same uid, update timestamp
        await fpRef.set({ uid, email, ip, ua, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return res.json({ success: true });
      }
    }

    // No fingerprint found — record it
    await fpRef.set({ uid, email, ip, ua, createdAt: admin.firestore.FieldValue.serverTimestamp() });

    return res.json({ success: true });
  } catch (err) {
    console.error('signup-monitor error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
