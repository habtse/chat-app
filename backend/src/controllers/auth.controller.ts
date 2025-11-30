import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { RegisterDTO, LoginDTO, TokenResponse } from '../types';
import { GoogleAuthService } from '../services/google-auth.service';

const prisma = new PrismaClient();

// Helper function to generate tokens
const generateTokens = (userId: string, email: string) => {
    const accessToken = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d' } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
};

// Helper function to create AI chat session for new user
const createAIChatSession = async (userId: string) => {
    try {
        const aiUser = await prisma.user.findUnique({
            where: { email: 'ai@shipper.chat' }
        });

        if (aiUser) {
            await prisma.chatSession.create({
                data: {
                    isGroup: false,
                    members: {
                        create: [
                            { userId: userId, isAdmin: true },
                            { userId: aiUser.id, isAdmin: false }
                        ]
                    },
                    messages: {
                        create: [
                            {
                                content: "Hello! I'm your AI Assistant. How can I help you today?",
                                senderId: aiUser.id
                            }
                        ]
                    }
                }
            });
            console.log(`Created AI chat session for user ${userId}`);
        }
    } catch (error) {
        console.error('Error creating AI chat session:', error);
        // Don't fail registration if AI chat creation fails
    }
};

// Register new user
export const register = async (req: Request, res: Response) => {
    try {
        const { email: rawEmail, name, password }: RegisterDTO = req.body;
        const email = rawEmail?.toLowerCase();

        // Validation
        if (!email || !name || !password) {
            return res.status(400).json({ message: 'Email, name, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                authType: 'JWT',
                profilePicUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            },
        });

        // Create AI chat session
        await createAIChatSession(user.id);

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email);

        const response: TokenResponse = {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profilePicUrl: user.profilePicUrl,
            },
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
};

// Login user
export const login = async (req: Request, res: Response) => {
    try {
        const { email: rawEmail, password }: LoginDTO = req.body;
        const email = rawEmail?.toLowerCase();

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user registered with JWT (not Google OAuth)
        if (user.authType !== 'JWT' || !user.passwordHash) {
            return res.status(401).json({ message: 'Invalid login method for this account' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email);

        const response: TokenResponse = {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profilePicUrl: user.profilePicUrl,
            },
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
};

// Refresh access token
export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string; email: string };

        // Generate new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId, email: decoded.email },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m' } as jwt.SignOptions
        );

        res.status(200).json({ accessToken });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};

// Google Login
export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Google token is required' });
        }

        // Verify Google token
        const payload = await GoogleAuthService.verifyToken(token);

        if (!payload || !payload.email) {
            return res.status(400).json({ message: 'Invalid Google token' });
        }

        const { email: rawEmail, name, picture } = payload;
        const email = rawEmail?.toLowerCase();

        console.log(`Google Login attempt for email: ${email}`);

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`User not found for email: ${email}. Creating new user.`);
            // Create new user
            user = await prisma.user.create({
                data: {
                    email: email!,
                    name: name || email!.split('@')[0],
                    authType: 'GOOGLE',
                    profilePicUrl: picture,
                },
            });

            // Create AI chat session
            await createAIChatSession(user.id);
        } else {
            console.log(`User found: ${user.id}, AuthType: ${user.authType}`);
            if (user.authType !== 'GOOGLE') {
                // Allow linking or just log them in? For MVP, let's just log them in but maybe warn?
                // Or update authType? Let's just proceed for now, assuming email ownership is sufficient.
                // Ideally we'd have multiple auth providers per user, but schema has single authType.
                // Let's update profile pic if missing
                if (!user.profilePicUrl && picture) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { profilePicUrl: picture },
                    });
                }
            }
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email);

        const response: TokenResponse = {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profilePicUrl: user.profilePicUrl,
            },
        };

        res.status(200).json(response);
    }
    catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Internal server error during Google login' });
    }
};

export default { register, login, refresh, googleLogin };
