import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Search, UserPlus } from 'lucide-react';

interface UserListDialogProps {
    children?: React.ReactNode;
    onSessionCreated: (session: any) => void;
}

export function UserListDialog({ children, onSessionCreated }: UserListDialogProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { accessToken, user: currentUser } = useAuth();

    useEffect(() => {
        if (isOpen && accessToken) {
            loadUsers();
        }
    }, [isOpen, accessToken]);

    const loadUsers = async () => {
        try {
            const data = await apiClient.getUsers(accessToken!);
            // Filter out current user
            setUsers(data.filter((u: any) => u.id !== currentUser?.id));
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const handleCreateSession = async (userId: string) => {
        try {
            const session = await apiClient.createSession({
                isGroup: false,
                memberIds: [userId]
            }, accessToken!);
            onSessionCreated(session);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon">
                        <UserPlus className="h-5 w-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="flex flex-col gap-2">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleCreateSession(user.id)}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full text-left"
                                >
                                    <Avatar>
                                        <AvatarImage src={user.profilePicUrl} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-zinc-500">{user.email}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
