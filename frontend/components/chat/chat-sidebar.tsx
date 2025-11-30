'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import { wsClient } from '../../lib/websocket-client';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { CreateGroupDialog } from './create-group-dialog';
import { CreateCategoryDialog } from './create-category-dialog';
import { MessageSearchDialog } from './message-search-dialog';
import { LogOut, Plus, Search, MessageSquare, Users, Bot, Check, CheckCheck } from 'lucide-react';

interface ChatSidebarProps {
    currentSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onSelectUser: (userId: string) => void;
}

export function ChatSidebar({ currentSessionId, onSelectSession, onSelectUser }: ChatSidebarProps) {
    const { user, logout, accessToken } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');
    const [searchQuery, setSearchQuery] = useState('');
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);

    const handleLogout = () => {
        logout(() => router.push('/auth/login'));
    };

    useEffect(() => {
        if (accessToken) {
            loadData();
        }

        const handleNewMessage = (payload: any) => {
            console.log('🔔 NEW_MESSAGE event received:', payload);
            setSessions(prevSessions => {
                console.log('📋 Current sessions:', prevSessions.map(s => ({ id: s.id, name: s.name || s.members.find((m: any) => m.userId !== user?.id)?.user?.name })));
                const sessionIndex = prevSessions.findIndex(s => s.id === payload.sessionId);
                console.log('📍 Session index:', sessionIndex, 'for sessionId:', payload.sessionId);
                if (sessionIndex === -1) return prevSessions;

                const updatedSession = { ...prevSessions[sessionIndex] };

                // Update messages array (create if doesn't exist)
                updatedSession.messages = [payload, ...(updatedSession.messages || [])];

                // Update unread count if message is not from current user
                if (payload.senderId !== user?.id) {
                    updatedSession.unreadCount = (updatedSession.unreadCount || 0) + 1;
                }

                // Move to top
                const newSessions = [...prevSessions];
                newSessions.splice(sessionIndex, 1);
                console.log('✅ Moving session to top:', updatedSession.name || updatedSession.members.find((m: any) => m.userId !== user?.id)?.user?.name);
                return [updatedSession, ...newSessions];
            });
        };

        wsClient.on('NEW_MESSAGE', handleNewMessage);

        return () => {
            wsClient.off('NEW_MESSAGE', handleNewMessage);
        };
    }, [accessToken, user?.id]);

    const loadData = async () => {
        if (!accessToken) return;
        try {
            const [sessionsData, usersData, categoriesData] = await Promise.all([
                apiClient.getSessions(accessToken),
                apiClient.getUsers(accessToken),
                apiClient.getCategories(accessToken),
            ]);
            setSessions(sessionsData);
            setUsers(usersData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to load sidebar data:', error);
        }
    };

    const handleCreateAI = async () => {
        if (!accessToken) return;
        try {
            const session = await apiClient.createAIChatSession(accessToken);
            onSelectSession(session.id);
            loadData(); // Reload to show new session
        } catch (error) {
            console.error('Failed to create AI session:', error);
        }
    };

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.members.some((m: any) => m.user.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory ? session.categoryId === selectedCategory : true;

        return matchesSearch && matchesCategory;
    });

    const filteredUsers = users.filter(u =>
        u.id !== user?.id &&
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const newWidth = e.clientX;
            // Constrain width between 280px and 500px
            if (newWidth >= 280 && newWidth <= 500) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div
            className="flex flex-col h-full bg-gray-50 border-r relative"
            style={{ width: `${sidebarWidth}px`, minWidth: '280px', maxWidth: '500px' }}
        >
            {/* Header */}
            <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Avatar>
                            <AvatarImage src={user?.profilePicUrl || undefined} />
                            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-sm">{user?.name}</p>
                            <div className="flex items-center text-xs text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                Online
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 text-gray-500" />
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search chats..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1.5 h-7 w-7"
                        onClick={() => setIsSearchDialogOpen(true)}
                        title="Search all messages"
                    >
                        <Search className="h-4 w-4 text-indigo-600" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-white">
                <button
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('chats')}
                >
                    Chats
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('users')}
                >
                    People
                </button>
            </div>

            {/* Categories (only for chats) */}
            {activeTab === 'chats' && (
                <div className="p-2 flex gap-2 overflow-x-auto bg-gray-50 border-b items-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsCategoryDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Badge
                        variant={selectedCategory === null ? "default" : "outline"}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All
                    </Badge>
                    {categories.map(cat => (
                        <Badge
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "outline"}
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.name}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                    {activeTab === 'chats' ? (
                        <>
                            <Button
                                variant="outline"
                                className="w-full justify-start mb-2"
                                onClick={() => setIsGroupDialogOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" /> New Group
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start mb-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                onClick={handleCreateAI}
                            >
                                <Bot className="mr-2 h-4 w-4" /> Chat with AI
                            </Button>

                            {filteredSessions.map((session) => {
                                const otherMember = session.isGroup
                                    ? null
                                    : session.members.find((m: any) => m.userId !== user?.id)?.user;

                                const displayName = session.isGroup ? session.name : otherMember?.name;
                                const displayImage = session.isGroup ? null : otherMember?.profilePicUrl; // Group avatar logic could be added
                                const lastMessage = session.messages?.[0]?.content || 'No messages yet';
                                const lastMessageSenderId = session.messages?.[0]?.sender?.id;
                                const isOwnMessage = lastMessageSenderId === user?.id;
                                const isRead = session.messages?.[0]?.isRead || false;

                                return (
                                    <div
                                        key={session.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-white shadow-sm border' : 'hover:bg-gray-100'
                                            }`}
                                        onClick={() => onSelectSession(session.id)}
                                    >
                                        <Avatar>
                                            <AvatarImage src={displayImage || undefined} />
                                            <AvatarFallback>
                                                {session.isGroup ? <Users className="h-4 w-4" /> : displayName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="flex justify-between items-baseline gap-2">
                                                {/* <p className="font-medium text-sm truncate flex-1 min-w-0">{displayName}</p> */}
                                                {session.unreadCount > 0 && (
                                                    <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                        {session.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2 min-w-0">
                                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                                    {isOwnMessage && session.messages?.[0] && (
                                                        isRead ? (
                                                            <CheckCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                                        ) : (
                                                            <Check className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                                        )
                                                    )}
                                                    {/* <p className="text-xs text-gray-500 truncate whitespace-nowrap flex-1 ">{lastMessage}</p> */}
                                                </div>
                                                {session.messages?.[0]?.createdAt && (
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                                                        {new Date(session.messages[0].createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            {filteredUsers.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100"
                                    onClick={() => onSelectUser(u.id)}
                                >
                                    <Avatar>
                                        <AvatarImage src={u.profilePicUrl || undefined} />
                                        <AvatarFallback>{u.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 w-0 overflow-hidden">
                                        <p className="font-medium text-sm truncate w-0">{u.name}</p>
                                        <p className="text-xs text-gray-500 truncate overflow-hidden text-ellipsis whitespace-nowrap w-0">{u.email}</p>
                                    </div>
                                    {u.isOnline && (
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </ScrollArea>

            <CreateGroupDialog
                open={isGroupDialogOpen}
                onOpenChange={setIsGroupDialogOpen}
                onGroupCreated={loadData}
            />

            <CreateCategoryDialog
                open={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
                onCategoryCreated={loadData}
            />

            <MessageSearchDialog
                open={isSearchDialogOpen}
                onOpenChange={setIsSearchDialogOpen}
                onSelectMessage={(sessionId) => onSelectSession(sessionId)}
            />

            {/* Resize Handle */}
            <div
                className={`absolute top-0 right-0 w-2 h-full cursor-col-resize group transition-colors ${isResizing ? 'bg-indigo-200' : 'hover:bg-indigo-100'
                    }`}
                onMouseDown={handleMouseDown}
                title="Drag to resize sidebar"
            >
                <div className="absolute top-1/2 right-0.5 transform -translate-y-1/2 w-1 h-16 bg-gray-400 rounded group-hover:bg-indigo-500 transition-colors" />
            </div>
        </div>
    );
}
