import { Router } from 'express';
import { getSessionMessages, markMessageAsRead, markSessionMessagesAsRead, searchMessages } from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management endpoints
 */

/**
 * @swagger
 * /messages/search:
 *   get:
 *     summary: Search messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of matching messages
 *       401:
 *         description: Unauthorized
 */
router.get('/search', searchMessages);

/**
 * @swagger
 * /messages/sessions/{id}/messages:
 *   get:
 *     summary: Get messages for a session
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: List of messages
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions/:id/messages', getSessionMessages);

/**
 * @swagger
 * /messages/{id}/read:
 *   put:
 *     summary: Mark message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *       404:
 *         description: Message not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/read', markMessageAsRead);

/**
 * @swagger
 * /messages/sessions/{id}/messages/read:
 *   put:
 *     summary: Mark all messages in session as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 */
router.put('/sessions/:id/messages/read', markSessionMessagesAsRead);

export default router;
