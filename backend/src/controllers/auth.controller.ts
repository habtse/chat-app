import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { RegisterDTO, LoginDTO, TokenResponse } from '../types';

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

// Register new user
export const register = async (req: Request, res: Response) => {
    try {
        const { email, name, password }: RegisterDTO = req.body;

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
        const { email, password }: LoginDTO = req.body;

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

export default { register, login, refresh };
