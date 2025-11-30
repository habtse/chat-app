import { Router } from 'express';
import { createAIChatSession, getAIUser } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI chat endpoints
 */

/**
 * @swagger
 * /ai/user:
 *   get:
 *     summary: Get AI user info
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI user details
 *       401:
 *         description: Unauthorized
 */
router.get('/user', getAIUser);

/**
 * @swagger
 * /ai/session:
 *   post:
 *     summary: Create AI chat session
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI session created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/session', createAIChatSession);

export default router;
