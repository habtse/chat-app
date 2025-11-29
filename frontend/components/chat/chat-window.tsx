'use client';

import React, { useEffect, useState } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { apiClient } from '@/lib/api-client';
import { wsClient } from '@/lib/websocket-client';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Video, MoreVertical, Users } from 'lucide-react';

interface ChatWindowProps {
    sessionId: string | null;
}

export function ChatWindow({ sessionId }: ChatWindowProps) {
    const { accessToken, user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        if (sessionId && accessToken) {
            loadMessages(sessionId);
            loadSession(sessionId);
            wsClient.joinSession(sessionId);
        }
        return () => {
            if (sessionId) {
                wsClient.leaveSession(sessionId);
            }
        };
    }, [sessionId, accessToken]);

    useEffect(() => {
        const handleNewMessage = (message: any) => {
            if (message.sessionId === sessionId) {
                setMessages((prev) => [...prev, message]);
            }
        };

        const handleStatusUpdate = (data: { userId: string; isOnline: boolean }) => {
            setSession((prevSession: any) => {
                if (!prevSession) return prevSession;
                return {
                    ...prevSession,
                    members: prevSession.members?.map((m: any) => ({
                        ...m,
                        user: m.user.id === data.userId
                            ? { ...m.user, isOnline: data.isOnline }
                            : m.user
                    }))
                };
            });
        };

        wsClient.on('NEW_MESSAGE', handleNewMessage);
        wsClient.on('USER_STATUS_UPDATE', handleStatusUpdate);

        return () => {
            wsClient.off('NEW_MESSAGE', handleNewMessage);
            wsClient.off('USER_STATUS_UPDATE', handleStatusUpdate);
        };
    }, [sessionId]);

    const loadSession = async (id: string) => {
        try {
            const data = await apiClient.getSession(id, accessToken!);
            setSession(data);
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    };

    const loadMessages = async (id: string) => {
        setIsLoading(true);
        try {
            const data: any = await apiClient.getMessages(id, accessToken!);
            setMessages(data.messages ? data.messages.reverse() : []);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!sessionId || !accessToken) return;
        wsClient.sendMessage(sessionId, content);
    };

    const handleTyping = (typing: boolean) => {
        if (!sessionId) return;
        if (typing) {
            wsClient.startTyping(sessionId);
        } else {
            wsClient.stopTyping(sessionId);
        }
    };

    if (!sessionId) {
        return (
            <div className="flex flex-1 items-center justify-center text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="text-center">
                    <div className="mb-4 text-6xl">💬</div>
                    <h3 className="text-lg font-semibold mb-1">Select a conversation</h3>
                    <p className="text-sm">Choose a chat from the sidebar to start messaging</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Determine display info for header
    const otherMembers = session?.members?.filter((m: any) => m.userId !== user?.id) || [];
    const displayMember = otherMembers[0]?.user;
    const displayName = session?.isGroup ? session?.name : displayMember?.name || 'Chat';
    const displayImage = session?.isGroup ? undefined : displayMember?.profilePicUrl;
    const isOnline = displayMember?.isOnline;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                            <AvatarImage src={displayImage || undefined} />
                            <AvatarFallback>
                                {session?.isGroup ? <Users className="h-5 w-5" /> : displayName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        {isOnline && !session?.isGroup && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{displayName}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {session?.isGroup ? `${otherMembers.length + 1} members` : isOnline ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            <MessageList messages={messages} />
            <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
        </div>
    );
}
