import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Search, Users } from 'lucide-react';

interface GroupChatDialogProps {
    children?: React.ReactNode;
    onSessionCreated: (session: any) => void;
}

export function GroupChatDialog({ children, onSessionCreated }: GroupChatDialogProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
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

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUserIds.size === 0) return;

        try {
            const session = await apiClient.createSession({
                isGroup: true,
                name: groupName,
                memberIds: Array.from(selectedUserIds)
            }, accessToken!);
            onSessionCreated(session);
            setIsOpen(false);
            setGroupName('');
            setSelectedUserIds(new Set());
        } catch (error) {
            console.error('Failed to create group session:', error);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
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
                        <Users className="h-5 w-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Group Chat</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                            id="group-name"
                            placeholder="Enter group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Select Members</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            <div className="flex flex-col gap-2">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                        onClick={() => toggleUserSelection(user.id)}
                                    >
                                        <Checkbox
                                            checked={selectedUserIds.has(user.id)}
                                            onCheckedChange={() => toggleUserSelection(user.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.profilePicUrl} />
                                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{user.name}</span>
                                            <span className="text-xs text-zinc-500">{user.email}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleCreateGroup}
                        disabled={!groupName.trim() || selectedUserIds.size === 0}
                    >
                        Create Group
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
