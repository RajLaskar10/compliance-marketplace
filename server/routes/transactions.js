const router = require('express').Router();
const jwtAuth = require('../middleware/jwtAuth');
const requireRole = require('../middleware/requireRole');
const requireKYC = require('../middleware/requireKYC');
const { createTransaction, listMyTransactions } = require('../controllers/transactionController');

router.use(jwtAuth);
router.post('/', requireRole('buyer'), requireKYC, createTransaction);
router.get('/', listMyTransactions);

module.exports = router;
