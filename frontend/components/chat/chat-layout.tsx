'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar, Session } from './sidebar';
import { ChatWindow } from './chat-window';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export function ChatLayout() {
    const { accessToken, user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (accessToken) {
            loadSessions();
        }
    }, [accessToken]);

    const loadSessions = async () => {
        try {
            const data: any = await apiClient.getSessions(accessToken!);
            const sessionList = Array.isArray(data) ? data : data.sessions || [];
            const formattedSessions = sessionList.map((session: any) => ({
                ...session,
                participants: session.members?.map((m: any) => m.user) || [],
                lastMessage: session.messages?.[0]
            }));
            setSessions(formattedSessions);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            <Sidebar
                sessions={sessions}
                selectedId={selectedSessionId}
                onSelect={setSelectedSessionId}
                currentUserId={user?.id}
                className="w-80 hidden md:flex border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
            <main className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-zinc-900/50">
                <ChatWindow sessionId={selectedSessionId} />
            </main>
        </div>
    );
}
