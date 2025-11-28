import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

const AI_USER_EMAIL = 'ai@shipper.chat';
const AI_USER_NAME = 'AI Assistant';

// Get or create AI user
export const getOrCreateAIUser = async () => {
    let aiUser = await prisma.user.findUnique({
        where: { email: AI_USER_EMAIL },
    });

    if (!aiUser) {
        aiUser = await prisma.user.create({
            data: {
                email: AI_USER_EMAIL,
                name: AI_USER_NAME,
                authType: 'JWT',
                profilePicUrl: 'https://ui-avatars.com/api/?name=AI+Assistant&background=6366f1&color=fff',
                isOnline: true, // AI is always online
            },
        });
    }

    return aiUser;
};

// Create AI chat session for user
export const createAIChatSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Get or create AI user
        const aiUser = await getOrCreateAIUser();

        // Check if user already has an AI chat session
        const existingSession = await prisma.chatSession.findFirst({
            where: {
                isGroup: false,
                members: {
                    some: {
                        userId: aiUser.id,
                    },
                },
            },
            include: {
                members: {
                    where: {
                        userId: userId,
                    },
                },
            },
        });

        if (existingSession && existingSession.members.length > 0) {
            // Return existing session
            const fullSession = await prisma.chatSession.findUnique({
                where: { id: existingSession.id },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profilePicUrl: true,
                                    isOnline: true,
                                },
                            },
                        },
                    },
                    messages: {
                        take: 50,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                    profilePicUrl: true,
                                },
                            },
                        },
                    },
                },
            });

            return res.status(200).json(fullSession);
        }

        // Create new AI chat session
        const session = await prisma.chatSession.create({
            data: {
                isGroup: false,
                members: {
                    create: [
                        { userId: userId },
                        { userId: aiUser.id },
                    ],
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profilePicUrl: true,
                                isOnline: true,
                            },
                        },
                    },
                },
                messages: true,
            },
        });

        // Send welcome message from AI
        await prisma.message.create({
            data: {
                content: "Hello! I'm your AI assistant. How can I help you today?",
                senderId: aiUser.id,
                chatSessionId: session.id,
            },
        });

        res.status(201).json(session);
    } catch (error) {
        console.error('Create AI chat session error:', error);
        res.status(500).json({ message: 'Failed to create AI chat session' });
    }
};

// Get AI user info
export const getAIUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const aiUser = await getOrCreateAIUser();

        res.status(200).json({
            id: aiUser.id,
            name: aiUser.name,
            email: aiUser.email,
            profilePicUrl: aiUser.profilePicUrl,
            isOnline: aiUser.isOnline,
        });
    } catch (error) {
        console.error('Get AI user error:', error);
        res.status(500).json({ message: 'Failed to get AI user' });
    }
};

export default { createAIChatSession, getAIUser, getOrCreateAIUser };
