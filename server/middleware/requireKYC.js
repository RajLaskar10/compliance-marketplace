module.exports = function requireKYC(req, res, next) {
  if (req.user?.kyc_status !== 'approved') {
    return res.status(403).json({ error: 'KYC verification required', kyc_status: req.user?.kyc_status });
  }
  next();
};
