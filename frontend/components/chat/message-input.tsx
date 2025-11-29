'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    onTyping?: (isTyping: boolean) => void;
}

export function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (content.trim()) {
            onSendMessage(content);
            setContent('');
            if (onTyping) onTyping(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (onTyping) onTyping(true);
    };

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    return (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mb-1 h-10 w-10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                    <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="min-h-[44px] max-h-[150px] resize-none py-3 pr-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-indigo-500"
                        rows={1}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 bottom-2 h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        <Smile className="h-5 w-5" />
                    </Button>
                </div>
                <Button
                    onClick={handleSend}
                    size="icon"
                    className="mb-1 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20"
                    disabled={!content.trim()}
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
