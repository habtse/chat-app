import { Router } from 'express';
import { createCategory, getUserCategories, assignCategoryToSession, deleteCategory } from '../controllers/category.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/v1/categories - Create category
router.post('/', createCategory);

// GET /api/v1/categories - Get user's categories
router.get('/', getUserCategories);

// PUT /api/v1/categories/sessions/:id - Assign category to session
router.put('/sessions/:id', assignCategoryToSession);

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', deleteCategory);

export default router;
