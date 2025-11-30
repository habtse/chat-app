'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar, Session } from './sidebar';
import { ChatWindow } from './chat-window';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
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

    // Mark messages as read when a session is opened
    useEffect(() => {
        if (selectedSessionId) {
            // Notify backend that messages in this session have been read
            wsClient.markAsRead(selectedSessionId);
        }
    }, [selectedSessionId]);

    // Listen for MARK_READ events from the server to update unread counts in real-time
    useEffect(() => {
        const handleMarkRead = (payload: any) => {
            if (!payload || !payload.sessionId) return;

            setSessions(prev => prev.map(s => {
                if (s.id !== payload.sessionId) return s;

                // Update unreadCount if provided, otherwise set to 0
                const unreadCount = typeof payload.unreadCount === 'number' ? payload.unreadCount : 0;

                // Optionally mark latest message as read
                const updatedLastMessage = s.lastMessage ? { ...s.lastMessage, isRead: true } : s.lastMessage;

                return { ...s, unreadCount, lastMessage: updatedLastMessage };
            }));
        };

        wsClient.on('MARK_READ', handleMarkRead);
        return () => {
            wsClient.off('MARK_READ', handleMarkRead);
        };
    }, []);

    const loadSessions = async () => {
        try {
            const data: any = await apiClient.getSessions(accessToken!);
            const sessionList = Array.isArray(data) ? data : data.sessions || [];
            const formattedSessions = sessionList.map((session: any) => ({
                ...session,
                participants: session.members?.map((m: any) => m.user) || [],
                lastMessage: session.messages?.[0] ? {
                    ...session.messages[0],
                    senderId: session.messages[0].sender?.id || session.messages[0].senderId
                } : undefined
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
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    defaultSize={100}
                    minSize={20}
                    maxSize={100}
                    className={`${selectedSessionId ? 'hidden md:block' : 'block'} chat-sidebar-panel border-r border-zinc-200 dark:border-zinc-800`}
                >
                    <style>{`
                        /* default: mobile = 100% */
                        .chat-sidebar-panel .responsive-sidebar {
                            flex-basis: 100% !important;
                            max-width: 100% !important;
                        }
                        /* tablet (md) = 40% */
                        @media (min-width: 768px) {
                            .chat-sidebar-panel .responsive-sidebar {
                                flex-basis: 40% !important;
                                max-width: 40% !important;
                            }
                        }
                        /* laptop (lg) = 20% */
                        @media (min-width: 1024px) {
                            .chat-sidebar-panel .responsive-sidebar {
                                flex-basis: 20% !important;
                                max-width: 20% !important;
                            }
                        }
                    `}</style>

                    <div className="responsive-sidebar h-full w-full">
                        <Sidebar
                            sessions={sessions}
                            selectedId={selectedSessionId}
                            onSelect={setSelectedSessionId}
                            onSessionCreated={handleSessionCreated}
                            currentUserId={user?.id}
                            className="h-full w-full bg-white dark:bg-zinc-900"
                        />
                    </div>
                </ResizablePanel>

                <ResizableHandle className="hidden md:flex" />

                <ResizablePanel defaultSize={80}>
                    <main className={`h-full flex-col min-w-0 bg-white/50 dark:bg-zinc-900/50 ${selectedSessionId ? 'flex' : 'hidden md:flex'}`}>
                        <ChatWindow
                            sessionId={selectedSessionId}
                            onBack={() => setSelectedSessionId(null)}
                        />
                    </main>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
