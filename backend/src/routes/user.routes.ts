import { Router } from 'express';
import { getAllUsers, getUserById, updateUserProfile, getOnlineUsers, getCurrentUser } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/users - Get all users
router.get('/', getAllUsers);

// GET /api/v1/users/me - Get current user
router.get('/me', getCurrentUser);

// GET /api/v1/users/online - Get online users
router.get('/online', getOnlineUsers);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', getUserById);

// PUT /api/v1/users/:id - Update user profile
router.put('/:id', updateUserProfile);

export default router;
