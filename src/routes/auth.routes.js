const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerRules, loginRules } = require('../validators/auth.validator');

const router = Router();

router.post('/register', authLimiter, registerRules, validate, controller.register);
router.post('/login', authLimiter, loginRules, validate, controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
