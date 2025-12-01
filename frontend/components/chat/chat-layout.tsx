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

    // Use a JS media-query check to render only one Sidebar instance.
    // This avoids a brief/hydration-time duplicate that can happen if both
    // mobile and desktop markup are present and only hidden via CSS.
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const handle = (e: MediaQueryListEvent) => setIsMobile(!e.matches);

        // initialize
        setIsMobile(!mq.matches);

        if (mq.addEventListener) {
            mq.addEventListener('change', handle);
        } else {
            // fallback for older browsers
            // @ts-ignore
            mq.addListener(handle);
        }

        return () => {
            if (mq.removeEventListener) {
                mq.removeEventListener('change', handle);
            } else {
                // @ts-ignore
                mq.removeListener(handle);
            }
        };
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {/* While we haven't determined size, render nothing to avoid duplicates */}
        {isMobile === null ? null : isMobile ? (
            // Mobile Layout - single Sidebar or ChatWindow
            <div className="w-full h-full flex">
            {!selectedSessionId ? (
                <div className="w-full h-full">
                <Sidebar
                    sessions={sessions}
                    selectedId={selectedSessionId}
                    onSelect={setSelectedSessionId}
                    onSessionCreated={handleSessionCreated}
                    currentUserId={user?.id}
                    className="h-full w-full bg-white dark:bg-zinc-900"
                />
                </div>
            ) : (
                <main className="w-full h-full flex flex-col min-w-0 bg-white/50 dark:bg-zinc-900/50">
                <ChatWindow
                    sessionId={selectedSessionId}
                    onBack={() => setSelectedSessionId(null)}
                />
                </main>
            )}
            </div>
        ) : (
            // Desktop Layout - Resizable Panels
            <ResizablePanelGroup direction="horizontal" className="hidden md:flex">
            <ResizablePanel
                defaultSize={30}
                minSize={25}
                maxSize={40}
                className="border-r border-zinc-200 dark:border-zinc-800"
            >
                <Sidebar
                sessions={sessions}
                selectedId={selectedSessionId}
                onSelect={setSelectedSessionId}
                onSessionCreated={handleSessionCreated}
                currentUserId={user?.id}
                className="h-full w-full bg-white dark:bg-zinc-900"
                />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={80}>
                <main className="h-full flex flex-col min-w-0 bg-white/50 dark:bg-zinc-900/50">
                <ChatWindow
                    sessionId={selectedSessionId}
                    onBack={() => setSelectedSessionId(null)}
                />
                </main>
            </ResizablePanel>
            </ResizablePanelGroup>
        )}
        </div>
    );
    
}
