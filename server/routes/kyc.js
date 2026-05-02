const router = require('express').Router();
const jwtAuth = require('../middleware/jwtAuth');
const { presign, submit, getMyKYC } = require('../controllers/kycController');

router.use(jwtAuth);
router.post('/presign', presign);
router.post('/submit', submit);
router.get('/me', getMyKYC);

module.exports = router;
