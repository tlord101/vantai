// Vercel Serverless function to handle /r?ref=CODE redirects
// Records the click by POSTing to /api/referral/track-click then redirects to the site root.
module.exports = async (req, res) => {
  try {
    const referralCode = req.query.ref || req.query.code || null;
    if (!referralCode) {
      res.status(400).send('Missing referral code');
      return;
    }



    res.writeHead(307, { Location: '/' });
    res.end();
  } catch (err) {
    console.error('Error in /api/r handler:', err);
    res.status(500).send('Internal error');
  }
};
