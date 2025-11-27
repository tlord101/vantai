// Referral click tracking removed.
// This endpoint previously recorded referral clicks to Firestore.
// Referral functionality has been removed from the app; this file is a stub.

module.exports = async (req, res) => {
  res.status(410).json({ success: false, error: 'Referral functionality removed' });
};
