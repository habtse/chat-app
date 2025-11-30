import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatLastSeen } from '@/lib/date-utils';

interface GroupDetailsDialogProps {
    session: any;
    children: React.ReactNode;
}

export function GroupDetailsDialog({ session, children }: GroupDetailsDialogProps) {
    if (!session || !session.isGroup) return <>{children}</>;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{session.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <h4 className="text-sm font-medium mb-3 text-zinc-500 dark:text-zinc-400">
                        {session.members.length} Members
                    </h4>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {session.members.map((member: any) => (
                                <div key={member.userId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar>
                                                <AvatarImage src={member.user.profilePicUrl} />
                                                <AvatarFallback>{member.user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            {member.user.isOnline && (
                                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {member.user.name}
                                            </span>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {member.user.isOnline ? (
                                                    <span className="text-green-600 dark:text-green-400">Online</span>
                                                ) : (
                                                    <span>{formatLastSeen(member.user.lastActive)}</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    {member.isAdmin && (
                                        <Badge variant="secondary" className="text-xs">
                                            Admin
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
