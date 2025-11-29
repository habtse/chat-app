'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api-client';
import { wsClient } from './websocket-client';

interface User {
    id: string;
    email: string;
    name: string;
    profilePicUrl: string | null;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, name: string, password: string) => Promise<void>;
    logout: () => void;
    refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load tokens from localStorage on mount
    useEffect(() => {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken && storedUser) {
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
            setUser(JSON.parse(storedUser));

            // Connect WebSocket
            wsClient.connect(storedAccessToken);
        }

        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response: any = await apiClient.login({ email, password });

            setUser(response.user);
            setAccessToken(response.accessToken);
            setRefreshToken(response.refreshToken);

            // Store in localStorage
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Connect WebSocket
            wsClient.connect(response.accessToken);
        } catch (error: any) {
            throw new Error(error.message || 'Login failed');
        }
    };

    const register = async (email: string, name: string, password: string) => {
        try {
            const response: any = await apiClient.register({ email, name, password });

            setUser(response.user);
            setAccessToken(response.accessToken);
            setRefreshToken(response.refreshToken);

            // Store in localStorage
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Connect WebSocket
            wsClient.connect(response.accessToken);
        } catch (error: any) {
            throw new Error(error.message || 'Registration failed');
        }
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Disconnect WebSocket
        wsClient.disconnect();
    };

    const refreshAccessToken = async () => {
        if (!refreshToken) {
            logout();
            return;
        }

        try {
            const response: any = await apiClient.refreshToken(refreshToken);
            setAccessToken(response.accessToken);
            localStorage.setItem('accessToken', response.accessToken);

            // Reconnect WebSocket with new token
            wsClient.disconnect();
            wsClient.connect(response.accessToken);
        } catch (error) {
            console.error('Failed to refresh token:', error);
            logout();
        }
    };

    // Auto-refresh token before it expires (every 14 minutes for 15-minute tokens)
    useEffect(() => {
        if (!accessToken) return;

        const interval = setInterval(() => {
            refreshAccessToken();
        }, 14 * 60 * 1000); // 14 minutes

        return () => clearInterval(interval);
    }, [accessToken, refreshToken]);

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isLoading,
                login,
                register,
                logout,
                refreshAccessToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
