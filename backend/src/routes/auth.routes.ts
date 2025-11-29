import { Router } from 'express';
import { register, login, refresh, googleLogin } from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/google
router.post('/google', googleLogin);

// POST /api/v1/auth/refresh
router.post('/refresh', refresh);

export default router;
