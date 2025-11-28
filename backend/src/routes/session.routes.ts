import { Router } from 'express';
import { createSession, getUserSessions, getSessionById, addMember, removeMember } from '../controllers/session.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/v1/sessions - Create new session
router.post('/', createSession);

// GET /api/v1/sessions - Get user's sessions
router.get('/', getUserSessions);

// GET /api/v1/sessions/:id - Get session by ID
router.get('/:id', getSessionById);

// POST /api/v1/sessions/:id/members - Add member to group
router.post('/:id/members', addMember);

// DELETE /api/v1/sessions/:id/members/:userId - Remove member from group
router.delete('/:id/members/:userId', removeMember);

export default router;
