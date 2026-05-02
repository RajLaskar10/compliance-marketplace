const router = require('express').Router();
const jwtAuth = require('../middleware/jwtAuth');
const { register, login, me, logout } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', jwtAuth, me);
router.post('/logout', jwtAuth, logout);

module.exports = router;
