'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send } from 'lucide-react';
import { wsClient } from '../../lib/websocket-client';

interface MessageInputProps {
    sessionId: string;
    onSendMessage: (content: string) => Promise<void>;
}

export function MessageInput({ sessionId, onSendMessage }: MessageInputProps) {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTyping = () => {
        wsClient.startTyping(sessionId);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            wsClient.stopTyping(sessionId);
        }, 2000);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(content);
            setContent('');
            wsClient.stopTyping(sessionId);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white flex items-center space-x-2">
            <Input
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                    handleTyping();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1"
                disabled={isSending}
            />
            <Button type="submit" size="icon" disabled={!content.trim() || isSending}>
                <Send className="h-4 w-4" />
            </Button>
        </form>
    );
}
