'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import { wsClient } from '../../lib/websocket-client';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { MoreVertical, Users, Tag } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "../ui/dropdown-menu"

interface ChatWindowProps {
    sessionId: string;
}

export function ChatWindow({ sessionId }: ChatWindowProps) {
    const { user, accessToken } = useAuth();
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        if (sessionId && accessToken) {
            loadSessionData();
            loadCategories();
            wsClient.joinSession(sessionId);

            // Mark messages as read
            apiClient.markSessionMessagesAsRead(sessionId, accessToken);
        }

        return () => {
            if (sessionId) {
                wsClient.leaveSession(sessionId);
            }
        };
    }, [sessionId, accessToken]);

    useEffect(() => {
        // WebSocket event listeners
        const handleNewMessage = (message: any) => {
            if (message.chatSessionId === sessionId) {
                setMessages((prev) => [...prev, message]);

                // Mark as read if we are viewing this session
                if (accessToken) {
                    apiClient.markMessageAsRead(message.id, accessToken);
                }
            }
        };

        const handleTyping = (data: any) => {
            if (data.sessionId === sessionId && data.userId !== user?.id) {
                setTypingUsers((prev) => {
                    const newSet = new Set(prev);
                    if (data.isTyping) {
                        newSet.add(data.userId);
                    } else {
                        newSet.delete(data.userId);
                    }
                    return newSet;
                });
            }
        };

        const handleRead = (data: any) => {
            // Update message read status in UI
            setMessages((prev) =>
                prev.map(msg =>
                    msg.id === data.messageId ? { ...msg, isRead: true } : msg
                )
            );
        };

        wsClient.on('NEW_MESSAGE', handleNewMessage);
        wsClient.on('TYPING_INDICATOR', handleTyping);
        wsClient.on('MARK_READ', handleRead); // Assuming backend broadcasts this

        return () => {
            wsClient.off('NEW_MESSAGE', handleNewMessage);
            wsClient.off('TYPING_INDICATOR', handleTyping);
            wsClient.off('MARK_READ', handleRead);
        };
    }, [sessionId, user?.id, accessToken]);

    const loadSessionData = async () => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
            const [sessionData, messagesData] = await Promise.all([
                apiClient.getSession(sessionId, accessToken),
                apiClient.getMessages(sessionId, accessToken),
            ]);
            setSession(sessionData);
            setMessages(messagesData.reverse()); // API returns newest first usually, we want oldest first for chat
        } catch (error) {
            console.error('Failed to load chat data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCategories = async () => {
        if (!accessToken) return;
        try {
            const cats = await apiClient.getCategories(accessToken);
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const handleAssignCategory = async (categoryId: string) => {
        if (!accessToken) return;
        try {
            await apiClient.assignCategoryToSession(categoryId, sessionId, accessToken);
            // Update local session state
            setSession((prev: any) => ({ ...prev, categoryId }));
        } catch (error) {
            console.error('Failed to assign category:', error);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!accessToken) return;
        try {
            // Optimistic update could be done here, but let's wait for WS echo for simplicity and consistency
            wsClient.sendMessage(sessionId, content);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    if (!sessionId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <p>Select a chat to start messaging</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const otherMember = session?.isGroup
        ? null
        : session?.members.find((m: any) => m.userId !== user?.id)?.user;

    const displayName = session?.isGroup ? session?.name : otherMember?.name;
    const displayImage = session?.isGroup ? null : otherMember?.profilePicUrl;

    return (
        <div className="flex-1 flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
                <div className="flex items-center space-x-3">
                    <Avatar>
                        <AvatarImage src={displayImage || undefined} />
                        <AvatarFallback>
                            {session?.isGroup ? <Users className="h-4 w-4" /> : displayName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold text-gray-900">{displayName}</h2>
                        {session?.isGroup ? (
                            <p className="text-xs text-gray-500">{session.members.length} members</p>
                        ) : (
                            otherMember?.isOnline && <p className="text-xs text-green-600">Online</p>
                        )}
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5 text-gray-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Tag className="mr-2 h-4 w-4" />
                                <span>Category</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={session?.categoryId} onValueChange={handleAssignCategory}>
                                    {categories.map((cat) => (
                                        <DropdownMenuRadioItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Messages */}
            <MessageList messages={messages} />

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 italic">
                    {typingUsers.size === 1 ? 'Someone is typing...' : 'Multiple people are typing...'}
                </div>
            )}

            {/* Input */}
            <MessageInput sessionId={sessionId} onSendMessage={handleSendMessage} />
        </div>
    );
}
