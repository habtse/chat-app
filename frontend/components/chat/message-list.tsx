'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
    sender: {
        name: string;
        profilePicUrl: string | null;
    };
}

interface MessageListProps {
    messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
    const { user } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <ScrollArea ref={scrollRef} className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="p-6 space-y-6">
                {messages.map((message) => {
                    const isMe = message.senderId === user?.id;

                    return (
                        <div
                            key={message.id}
                            className={cn("flex", isMe ? 'justify-end' : 'justify-start')}
                        >
                            <div className={cn("flex items-end max-w-[75%] gap-2", isMe ? 'flex-row-reverse' : 'flex-row')}>
                                {!isMe && (
                                    <Avatar className="h-8 w-8 mb-1 flex-shrink-0">
                                        <AvatarImage src={message.sender.profilePicUrl || undefined} />
                                        <AvatarFallback className="text-xs">{message.sender.name[0]}</AvatarFallback>
                                    </Avatar>
                                )}

                                <div
                                    className={cn(
                                        "rounded-2xl px-4 py-2.5 shadow-sm",
                                        isMe
                                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md'
                                            : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md border border-zinc-200 dark:border-zinc-700'
                                    )}
                                >
                                    {!isMe && (
                                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                                            {message.sender.name}
                                        </p>
                                    )}
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>
                                    <div className={cn(
                                        "flex items-center justify-end gap-1 mt-1.5",
                                        isMe ? 'text-indigo-200' : 'text-zinc-400 dark:text-zinc-500'
                                    )}>
                                        <span className="text-[10px] font-medium">{formatTime(message.createdAt)}</span>
                                        {isMe && (
                                            <span>
                                                {message.isRead ? (
                                                    <CheckCheck className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
