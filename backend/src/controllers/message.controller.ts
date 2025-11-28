import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

// Get messages for a session
export const getSessionMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { limit = '50', offset = '0' } = req.query;

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

        // Get messages
        const messages = await prisma.message.findMany({
            where: {
                chatSessionId: id,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePicUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
        });

        res.status(200).json(messages.reverse()); // Reverse to show oldest first
    } catch (error) {
        console.error('Get session messages error:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

// Mark message as read (Bonus B3)
export const markMessageAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;

        // Get message
        const message = await prisma.message.findUnique({
            where: { id },
            include: {
                chatSession: {
                    include: {
                        members: true,
                    },
                },
            },
        });

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user is a member
        const isMember = message.chatSession.members.some((m: any) => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: 'You are not a member of this session' });
        }

        // Update message
        const updatedMessage = await prisma.message.update({
            where: { id },
            data: { isRead: true },
        });

        res.status(200).json(updatedMessage);
    } catch (error) {
        console.error('Mark message as read error:', error);
        res.status(500).json({ message: 'Failed to mark message as read' });
    }
};

// Mark all messages in a session as read
export const markSessionMessagesAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check if user is a member
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

        // Mark all messages as read (except user's own messages)
        await prisma.message.updateMany({
            where: {
                chatSessionId: id,
                senderId: { not: userId },
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        res.status(200).json({ message: 'All messages marked as read' });
    } catch (error) {
        console.error('Mark session messages as read error:', error);
        res.status(500).json({ message: 'Failed to mark messages as read' });
    }
};

// Search messages (Bonus B6)
export const searchMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { q, sessionId } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Build where clause
        const whereClause: any = {
            content: {
                contains: q as string,
                mode: 'insensitive',
            },
            chatSession: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
        };

        // Filter by session if provided
        if (sessionId) {
            whereClause.chatSessionId = sessionId as string;
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profilePicUrl: true,
                    },
                },
                chatSession: {
                    select: {
                        id: true,
                        name: true,
                        isGroup: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Search messages error:', error);
        res.status(500).json({ message: 'Failed to search messages' });
    }
};

export default { getSessionMessages, markMessageAsRead, markSessionMessagesAsRead, searchMessages };
