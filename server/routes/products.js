const router = require('express').Router();
const jwtAuth = require('../middleware/jwtAuth');
const requireRole = require('../middleware/requireRole');
const requireKYC = require('../middleware/requireKYC');
const { listProducts, getProduct, createProduct, updateProduct } = require('../controllers/productController');

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', jwtAuth, requireRole('seller'), requireKYC, createProduct);
router.patch('/:id', jwtAuth, requireRole('seller'), updateProduct);

module.exports = router;
