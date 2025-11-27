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

    // helper: render a friendly 403 HTML page
    const render403 = (title, message, details) => {
      return `<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>403 Forbidden</title>
        <style>
          body { background:#ffb020; font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial; color:#111; display:flex; align-items:center; justify-content:center; height:100vh; margin:0 }
          .card { background:rgba(255,255,255,0.95); max-width:760px; width:100%; margin:24px; border-radius:12px; padding:32px; box-shadow:0 8px 30px rgba(0,0,0,0.12); display:flex; gap:24px; align-items:center }
          .left { flex:0 0 160px; display:flex; align-items:center; justify-content:center }
          .big { font-size:96px; font-weight:800; color:#111; line-height:1 }
          h1 { margin:0; font-size:20px }
          p { margin:8px 0 0; color:#333 }
          .meta { margin-top:12px; font-size:13px; color:#444 }
          .actions { margin-top:18px }
          .btn { display:inline-block; background:#111; color:#fff; padding:10px 14px; border-radius:8px; text-decoration:none }
          .small { font-size:13px; color:#222 }
          code { background:#f3f4f6; padding:4px 6px; border-radius:6px }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="left"><div class="big">403</div></div>
          <div class="right">
            <h1>${title}</h1>
            <p>${message}</p>
            <div class="meta">
              <div><strong>Reason:</strong> ${details || 'Access denied'}</div>
              <div class="small">If you believe this is a mistake, try signing in from the same device or contact support.</div>
            </div>
            <div class="actions">
              <a class="btn" href="/">Return Home</a>
            </div>
          </div>
        </div>
      </body>
      </html>`;
    };

    // Check if IP already blocked
    const ipDoc = await db.collection('security').doc('blocked_ips').collection('ips').doc(ip).get();
    if (ipDoc.exists) {
      // disable this new user
      try { await admin.auth().updateUser(uid, { disabled: true }); } catch (e) { /* ignore */ }
      const reason = 'Signups from this IP address have been blocked due to suspicious activity.';
      return res.status(403).set('Content-Type', 'text/html; charset=utf-8').send(render403('Access blocked', 'You cannot complete this action from your current network.', reason));
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
        const reason = 'Multiple accounts were created from the same device or network. Both accounts have been disabled for review.';
        return res.status(403).set('Content-Type', 'text/html; charset=utf-8').send(render403('Account disabled', 'We detected suspicious signup activity and have temporarily disabled the account(s).', reason));
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
