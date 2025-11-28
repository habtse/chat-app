import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

// Get all users
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                profilePicUrl: true,
                isOnline: true,
                authType: true,
                lastActive: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

// Get user by ID
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                profilePicUrl: true,
                isOnline: true,
                authType: true,
                lastActive: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
};

// Update user profile
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, profilePicUrl } = req.body;

        // Check if user is updating their own profile
        if (req.user?.userId !== id) {
            return res.status(403).json({ message: 'You can only update your own profile' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(profilePicUrl && { profilePicUrl }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                profilePicUrl: true,
                isOnline: true,
                authType: true,
            },
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

// Get online users
export const getOnlineUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                isOnline: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                profilePicUrl: true,
                isOnline: true,
            },
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Get online users error:', error);
        res.status(500).json({ message: 'Failed to fetch online users' });
    }
};

// Get current user profile
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                profilePicUrl: true,
                isOnline: true,
                authType: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
};

export default { getAllUsers, getUserById, updateUserProfile, getOnlineUsers, getCurrentUser };
