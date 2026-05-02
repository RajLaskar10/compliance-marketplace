const router = require('express').Router();
const jwtAuth = require('../middleware/jwtAuth');
const requireRole = require('../middleware/requireRole');
const { listFlaggedTransactions, resolveFlag, listPendingKYC, reviewKYC, getAuditLog } = require('../controllers/adminController');

router.use(jwtAuth, requireRole('admin'));

router.get('/flags', listFlaggedTransactions);
router.patch('/flags/:txnId/resolve', resolveFlag);
router.get('/kyc', listPendingKYC);
router.patch('/kyc/:kycId/review', reviewKYC);
router.get('/audit', getAuditLog);

module.exports = router;
