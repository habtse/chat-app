import { Router } from 'express';
import { getSessionMessages, markMessageAsRead, markSessionMessagesAsRead, searchMessages } from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/messages/search - Search messages
router.get('/search', searchMessages);

// GET /api/v1/sessions/:id/messages - Get messages for a session
router.get('/sessions/:id/messages', getSessionMessages);

// PUT /api/v1/messages/:id/read - Mark message as read
router.put('/:id/read', markMessageAsRead);

// PUT /api/v1/sessions/:id/messages/read - Mark all messages in session as read
router.put('/sessions/:id/messages/read', markSessionMessagesAsRead);

export default router;
