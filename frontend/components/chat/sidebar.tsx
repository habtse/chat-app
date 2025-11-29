import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Search, LogOut, Settings, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

import { UserListDialog } from './user-list-dialog';

export interface Session {
    id: string;
    name?: string;
    isGroup: boolean;
    participants: {
        id: string;
        name: string;
        profilePicUrl: string | null;
        isOnline?: boolean;
    }[];
    lastMessage?: {
        content: string;
        createdAt: string;
        senderId: string;
    };
    unreadCount?: number;
}

interface SidebarProps {
    sessions: Session[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onSessionCreated: (session: any) => void;
    currentUserId?: string;
    className?: string;
}

export function Sidebar({ sessions, selectedId, onSelect, onSessionCreated, currentUserId, className }: SidebarProps) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSessions = sessions.filter(session => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        const otherParticipants = session.participants?.filter(p => p.id !== currentUserId) || [];
        const displayName = session.name || otherParticipants[0]?.name || 'Unknown User';
        const lastMessageContent = session.lastMessage?.content || '';

        // Search by display name, participant names, or last message content
        return (
            displayName.toLowerCase().includes(query) ||
            otherParticipants.some(p => p.name.toLowerCase().includes(query)) ||
            lastMessageContent.toLowerCase().includes(query)
        );
    });

    const handleLogout = () => {
        logout(() => router.push('/auth/login'));
    };

    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-zinc-900", className)}>
            {/* Header / User Profile */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                            <AvatarImage src={user?.profilePicUrl || undefined} />
                            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">Online</span>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <UserListDialog onSessionCreated={onSessionCreated}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </UserListDialog>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-zinc-500 hover:text-red-600">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Session List */}
            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 p-2">
                    {filteredSessions.map((session) => {
                        const otherParticipants = session.participants?.filter(p => p.id !== currentUserId) || [];
                        const displayParticipant = otherParticipants[0];
                        const displayName = session.name || displayParticipant?.name || 'Unknown User';
                        const displayImage = session.isGroup ? undefined : displayParticipant?.profilePicUrl;
                        const isOnline = displayParticipant?.isOnline;
                        const isSelected = selectedId === session.id;

                        return (
                            <button
                                key={session.id}
                                onClick={() => onSelect(session.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all text-left group relative",
                                    isSelected
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                )}
                            >
                                <div className="relative flex-shrink-0">
                                    <Avatar className={cn("h-12 w-12 border-2", isSelected ? "border-indigo-500" : "border-white dark:border-zinc-900")}>
                                        <AvatarImage src={displayImage || undefined} />
                                        <AvatarFallback className={cn(isSelected ? "text-indigo-600 bg-white" : "")}>
                                            {displayName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    {isOnline && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={cn("font-semibold truncate", isSelected ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                                            {displayName}
                                        </span>
                                        {session.lastMessage && (
                                            <span className={cn(
                                                "text-xs",
                                                isSelected ? "text-indigo-200" : "text-zinc-400"
                                            )}>
                                                {formatDistanceToNow(new Date(session.lastMessage.createdAt), { addSuffix: false })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-sm truncate max-w-[85%]",
                                            isSelected ? "text-indigo-100" : "text-zinc-500 dark:text-zinc-400"
                                        )}>
                                            {session.lastMessage?.content || "No messages yet"}
                                        </span>
                                        {session.unreadCount && session.unreadCount > 0 ? (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-medium border-2 border-white dark:border-zinc-900">
                                                {session.unreadCount}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
