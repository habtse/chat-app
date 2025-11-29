'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { CreateGroupDialog } from './create-group-dialog';
import { CreateCategoryDialog } from './create-category-dialog';
import { MessageSearchDialog } from './message-search-dialog';
import { LogOut, Plus, Search, MessageSquare, Users, Bot } from 'lucide-react';

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

    const handleLogout = () => {
        logout(() => router.push('/auth/login'));
    };

    useEffect(() => {
        if (accessToken) {
            loadData();
        }
    }, [accessToken]);

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

    return (
        <div className="flex flex-col h-full bg-gray-50 border-r w-80">
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

                                return (
                                    <div
                                        key={session.id}
                                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-white shadow-sm border' : 'hover:bg-gray-100'
                                            }`}
                                        onClick={() => onSelectSession(session.id)}
                                    >
                                        <Avatar>
                                            <AvatarImage src={displayImage || undefined} />
                                            <AvatarFallback>
                                                {session.isGroup ? <Users className="h-4 w-4" /> : displayName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <p className="font-medium text-sm truncate">{displayName}</p>
                                                {session.unreadCount > 0 && (
                                                    <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                        {session.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{lastMessage}</p>
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
                                    className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100"
                                    onClick={() => onSelectUser(u.id)}
                                >
                                    <Avatar>
                                        <AvatarImage src={u.profilePicUrl || undefined} />
                                        <AvatarFallback>{u.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{u.name}</p>
                                        <p className="text-xs text-gray-500">{u.email}</p>
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
        </div>
    );
}
