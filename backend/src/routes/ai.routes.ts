import { Router } from 'express';
import { createAIChatSession, getAIUser } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Assistant
 *   description: Assistant chat endpoints
 */

/**
 * @swagger
 * /ai/user:
 *   get:
 *     summary: Get Assistant user info
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assistant user details
 *       401:
 *         description: Unauthorized
 */
router.get('/user', getAIUser);

/**
 * @swagger
 * /ai/session:
 *   post:
 *     summary: Create Assistant chat session
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assistant session created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/session', createAIChatSession);

export default router;
