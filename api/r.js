// Vercel Serverless function to handle /r?ref=CODE redirects
// Records the click by POSTing to /api/referral/track-click then redirects to the site root.
module.exports = async (req, res) => {
  try {
    const referralCode = req.query.ref || req.query.code || null;
    if (!referralCode) {
      res.status(400).send('Missing referral code');
      return;
    }

    // Construct absolute URL to the track endpoint on this deployment
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const trackUrl = `${protocol}://${host}/api/referral/track-click`;

    // Fire-and-forget record
    try {
      await fetch(trackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode })
      });
    } catch (err) {
      // Log but don't block the redirect
      console.error('Failed to POST track-click from /api/r:', err);
    }

    // Redirect to root with referral code preserved so client-side tracker can pick it up
    // e.g. redirect to '/?ref=CODE'
    const redirectTo = `/?ref=${encodeURIComponent(referralCode)}`;
    res.writeHead(307, { Location: redirectTo });
    res.end();
  } catch (err) {
    console.error('Error in /api/r handler:', err);
    res.status(500).send('Internal error');
  }
};
