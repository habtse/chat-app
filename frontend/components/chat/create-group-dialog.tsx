'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';

interface User {
    id: string;
    name: string;
    email: string;
    profilePicUrl: string | null;
    isOnline: boolean;
}

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupCreated: () => void;
}

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
    const { accessToken } = useAuth();
    const [name, setName] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (open && accessToken) {
            loadUsers();
        }
    }, [open, accessToken]);

    const loadUsers = async () => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
            const allUsers = await apiClient.getUsers(accessToken);
            // Filter out current user is handled by backend usually, but let's be safe if we want
            setUsers(allUsers);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUserIds(newSelected);
    };

    const handleCreate = async () => {
        if (!name.trim() || selectedUserIds.size === 0 || !accessToken) return;

        setIsCreating(true);
        try {
            await apiClient.createSession({
                isGroup: true,
                name: name.trim(),
                memberIds: Array.from(selectedUserIds),
            }, accessToken);

            onGroupCreated();
            onOpenChange(false);
            setName('');
            setSelectedUserIds(new Set());
        } catch (error) {
            console.error('Failed to create group:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Group Name
                        </label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project Team"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">
                            Select Members ({selectedUserIds.size})
                        </label>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            {isLoading ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">Loading users...</div>
                            ) : (
                                <div className="space-y-2">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${selectedUserIds.has(user.id) ? 'bg-accent' : 'hover:bg-muted'
                                                }`}
                                            onClick={() => toggleUser(user.id)}
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.profilePicUrl || undefined} />
                                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 text-sm">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                            {selectedUserIds.has(user.id) && (
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!name.trim() || selectedUserIds.size === 0 || isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Group'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
