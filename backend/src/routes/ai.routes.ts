import { Router } from 'express';
import { createAIChatSession, getAIUser } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/ai/user - Get AI user info
router.get('/user', getAIUser);

// POST /api/v1/ai/session - Create AI chat session
router.post('/session', createAIChatSession);

export default router;
