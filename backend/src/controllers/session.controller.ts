import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, CreateSessionDTO, AddMemberDTO } from '../types';

const prisma = new PrismaClient();

// Create a new chat session (one-on-one or group)
export const createSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { isGroup, name, memberIds, categoryId }: CreateSessionDTO = req.body;

        // Validation
        if (!memberIds || memberIds.length === 0) {
            return res.status(400).json({ message: 'At least one member is required' });
        }

        if (isGroup && !name) {
            return res.status(400).json({ message: 'Group name is required for group chats' });
        }

        // For one-on-one chats, check if session already exists
        if (!isGroup && memberIds.length === 1) {
            const otherUserId = memberIds[0];

            // Find existing one-on-one session
            const existingSession = await prisma.chatSession.findFirst({
                where: {
                    isGroup: false,
                    members: {
                        every: {
                            OR: [
                                { userId: userId },
                                { userId: otherUserId }
                            ]
                        }
                    }
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
                                }
                            }
                        }
                    },
                    category: true,
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            if (existingSession && existingSession.members.length === 2) {
                return res.status(200).json(existingSession);
            }
        }

        // Create new session
        const allMemberIds = [...new Set([userId, ...memberIds])]; // Include creator and remove duplicates

        const session = await prisma.chatSession.create({
            data: {
                isGroup,
                name: isGroup ? name : undefined,
                categoryId,
                members: {
                    create: allMemberIds.map((memberId, index) => ({
                        userId: memberId,
                        isAdmin: index === 0, // First member (creator) is admin
                    })),
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
                            }
                        }
                    }
                },
                category: true,
                messages: true,
            },
        });

        res.status(201).json(session);
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ message: 'Failed to create chat session' });
    }
};

// Get all sessions for the current user
export const getUserSessions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        // console.log('userId', userId);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const sessions = await prisma.chatSession.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
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
                                email: true,
                                profilePicUrl: true,
                                isOnline: true,
                            }
                        }
                    }
                },
                category: true,
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                },
            },
            orderBy: {
                id: 'desc', // Most recent first
            },
        });

        console.log('sessions', sessions);
        res.status(200).json(sessions);
    } catch (error) {
        console.error('Get user sessions error:', error);
        res.status(500).json({ message: 'Failed to fetch chat sessions' });
    }
};

// Get session by ID
export const getSessionById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;

        const session = await prisma.chatSession.findUnique({
            where: { id },
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
                            }
                        }
                    }
                },
                category: true,
            },
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if user is a member
        const isMember = session.members.some(m => m.userId === userId);
        if (!isMember) {
            return res.status(403).json({ message: 'You are not a member of this session' });
        }

        res.status(200).json(session);
    } catch (error) {
        console.error('Get session by ID error:', error);
        res.status(500).json({ message: 'Failed to fetch session' });
    }
};

// Add member to group
export const addMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { userId }: AddMemberDTO = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Check if session exists and is a group
        const session = await prisma.chatSession.findUnique({
            where: { id },
            include: {
                members: true,
            },
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (!session.isGroup) {
            return res.status(400).json({ message: 'Cannot add members to one-on-one chats' });
        }

        // Check if current user is admin
        const currentMember = session.members.find(m => m.userId === currentUserId);
        if (!currentMember?.isAdmin) {
            return res.status(403).json({ message: 'Only admins can add members' });
        }

        // Check if user is already a member
        const isAlreadyMember = session.members.some(m => m.userId === userId);
        if (isAlreadyMember) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        // Add member
        await prisma.groupMember.create({
            data: {
                userId,
                chatSessionId: id,
                isAdmin: false,
            },
        });

        // Return updated session
        const updatedSession = await prisma.chatSession.findUnique({
            where: { id },
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
                            }
                        }
                    }
                },
                category: true,
            },
        });

        res.status(200).json(updatedSession);
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: 'Failed to add member' });
    }
};

// Remove member from group
export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id, userId } = req.params;

        // Check if session exists and is a group
        const session = await prisma.chatSession.findUnique({
            where: { id },
            include: {
                members: true,
            },
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (!session.isGroup) {
            return res.status(400).json({ message: 'Cannot remove members from one-on-one chats' });
        }

        // Check if current user is admin or removing themselves
        const currentMember = session.members.find(m => m.userId === currentUserId);
        if (!currentMember?.isAdmin && currentUserId !== userId) {
            return res.status(403).json({ message: 'Only admins can remove other members' });
        }

        // Remove member
        await prisma.groupMember.delete({
            where: {
                userId_chatSessionId: {
                    userId,
                    chatSessionId: id,
                },
            },
        });

        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Failed to remove member' });
    }
};

export default { createSession, getUserSessions, getSessionById, addMember, removeMember };
