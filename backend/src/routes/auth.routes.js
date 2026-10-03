const express = require('express');
const { login } = require('../controllers/auth.controller');
const { loginLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, login);

module.exports = router;
