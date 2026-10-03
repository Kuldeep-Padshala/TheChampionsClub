import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Login endpoint with rate limiter to prevent brute force
router.post('/login', rateLimiter, login);

export default router;
