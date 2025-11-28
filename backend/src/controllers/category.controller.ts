import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, CreateCategoryDTO } from '../types';

const prisma = new PrismaClient();

// Create a new category
export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { name }: CreateCategoryDTO = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
            where: { name },
        });

        if (existingCategory) {
            // Associate user with existing category
            const userCategory = await prisma.userCategory.findUnique({
                where: {
                    userId_categoryId: {
                        userId,
                        categoryId: existingCategory.id,
                    },
                },
            });

            if (userCategory) {
                return res.status(409).json({ message: 'You already have this category' });
            }

            await prisma.userCategory.create({
                data: {
                    userId,
                    categoryId: existingCategory.id,
                },
            });

            return res.status(200).json(existingCategory);
        }

        // Create new category
        const category = await prisma.category.create({
            data: {
                name,
                userCategories: {
                    create: {
                        userId,
                    },
                },
            },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ message: 'Failed to create category' });
    }
};

// Get user's categories
export const getUserCategories = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userCategories = await prisma.userCategory.findMany({
            where: { userId },
            include: {
                category: {
                    include: {
                        sessions: {
                            where: {
                                members: {
                                    some: {
                                        userId,
                                    },
                                },
                            },
                            include: {
                                members: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                name: true,
                                                profilePicUrl: true,
                                                isOnline: true,
                                            },
                                        },
                                    },
                                },
                                messages: {
                                    take: 1,
                                    orderBy: { createdAt: 'desc' },
                                },
                            },
                        },
                    },
                },
            },
        });

        const categories = userCategories.map((uc: any) => uc.category);

        res.status(200).json(categories);
    } catch (error) {
        console.error('Get user categories error:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
};

// Assign category to session
export const assignCategoryToSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { categoryId } = req.body;

        // Check if user is a member of the session
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_chatSessionId: {
                    userId,
                    chatSessionId: id,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({ message: 'You are not a member of this session' });
        }

        // Update session
        const session = await prisma.chatSession.update({
            where: { id },
            data: {
                categoryId: categoryId || null,
            },
            include: {
                category: true,
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profilePicUrl: true,
                                isOnline: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json(session);
    } catch (error) {
        console.error('Assign category to session error:', error);
        res.status(500).json({ message: 'Failed to assign category' });
    }
};

// Delete category
export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check if user has this category
        const userCategory = await prisma.userCategory.findFirst({
            where: {
                userId,
                categoryId: id,
            },
        });

        if (!userCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Remove user's association with category
        await prisma.userCategory.delete({
            where: {
                userId_categoryId: {
                    userId,
                    categoryId: id,
                },
            },
        });

        // Check if any other users have this category
        const otherUsers = await prisma.userCategory.findFirst({
            where: {
                categoryId: id,
            },
        });

        // If no other users, delete the category
        if (!otherUsers) {
            await prisma.category.delete({
                where: { id },
            });
        }

        res.status(200).json({ message: 'Category removed successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ message: 'Failed to delete category' });
    }
};

export default { createCategory, getUserCategories, assignCategoryToSession, deleteCategory };
