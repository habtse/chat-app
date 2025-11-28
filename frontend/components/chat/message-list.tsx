'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Check, CheckCheck } from 'lucide-react';

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
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
                {messages.map((message) => {
                    const isMe = message.senderId === user?.id;

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-end max-w-[70%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-2`}>
                                {!isMe && (
                                    <Avatar className="h-8 w-8 mb-1">
                                        <AvatarImage src={message.sender.profilePicUrl || undefined} />
                                        <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                                    </Avatar>
                                )}

                                <div
                                    className={`rounded-2xl px-4 py-2 shadow-sm ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-900 rounded-bl-none border'
                                        }`}
                                >
                                    {!isMe && (
                                        <p className="text-xs font-semibold text-gray-500 mb-1 ml-1">
                                            {message.sender.name}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <div className={`flex items-center justify-end space-x-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        <span className="text-[10px]">{formatTime(message.createdAt)}</span>
                                        {isMe && (
                                            <span>
                                                {message.isRead ? (
                                                    <CheckCheck className="h-3 w-3" />
                                                ) : (
                                                    <Check className="h-3 w-3" />
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
