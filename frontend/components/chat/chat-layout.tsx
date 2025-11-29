'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar, Session } from './sidebar';
import { ChatWindow } from './chat-window';
import { apiClient } from '@/lib/api-client';
import { wsClient } from '@/lib/websocket-client';
import { useAuth } from '@/lib/auth-context';

export function ChatLayout() {
    const { accessToken, user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);


    // console.log('user', user, accessToken);

    useEffect(() => {
        if (accessToken) {
            loadSessions();
        }
    }, [accessToken]);

    // Listen for user status updates
    useEffect(() => {
        const handleStatusUpdate = (data: { userId: string; isOnline: boolean }) => {
            setSessions((prevSessions) =>
                prevSessions.map((session) => ({
                    ...session,
                    participants: session.participants.map((participant) =>
                        participant.id === data.userId
                            ? { ...participant, isOnline: data.isOnline }
                            : participant
                    ),
                }))
            );
        };

        wsClient.on('USER_STATUS_UPDATE', handleStatusUpdate);

        return () => {
            wsClient.off('USER_STATUS_UPDATE', handleStatusUpdate);
        };
    }, []);

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

    const handleSessionCreated = (newSession: any) => {
        loadSessions();
        setSelectedSessionId(newSession.id);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            <Sidebar
                sessions={sessions}
                selectedId={selectedSessionId}
                onSelect={setSelectedSessionId}
                onSessionCreated={handleSessionCreated}
                currentUserId={user?.id}
                className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${selectedSessionId ? 'hidden md:flex' : 'flex'}`}
            />
            <main className={`flex-1 flex-col min-w-0 bg-white/50 dark:bg-zinc-900/50 ${selectedSessionId ? 'flex' : 'hidden md:flex'}`}>
                <ChatWindow
                    sessionId={selectedSessionId}
                    onBack={() => setSelectedSessionId(null)}
                />
            </main>
        </div>
    );
}
