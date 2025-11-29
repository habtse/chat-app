'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { Search, Loader2, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface MessageSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectMessage: (sessionId: string, messageId: string) => void;
}

// Helper function to highlight search terms
function highlightText(text: string, query: string) {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 text-zinc-900 dark:text-zinc-100 font-semibold px-0.5 rounded">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}

export function MessageSearchDialog({ open, onOpenChange, onSelectMessage }: MessageSearchDialogProps) {
    const { accessToken } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout for debounced search
        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                const data = await apiClient.searchMessages(query, accessToken!);
                setResults(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to search messages:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms debounce

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [query, accessToken]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-indigo-600" />
                        Search Messages
                    </DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type to search messages..."
                        className="pl-10 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-indigo-500"
                        autoFocus
                    />
                </div>

                <ScrollArea className="h-[400px] mt-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                            <p className="text-sm text-zinc-500">Searching...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-2">
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 px-1">
                                Found {results.length} {results.length === 1 ? 'message' : 'messages'}
                            </div>
                            {results.map((msg) => (
                                <div
                                    key={msg.id}
                                    className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-all hover:shadow-sm"
                                    onClick={() => {
                                        onSelectMessage(msg.chatSessionId, msg.id);
                                        onOpenChange(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={msg.sender?.profilePicUrl} />
                                            <AvatarFallback className="text-xs">{msg.sender?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {msg.sender?.name}
                                        </span>
                                        {msg.chatSession && (
                                            <Badge variant="outline" className="text-xs">
                                                <MessageSquare className="h-3 w-3 mr-1" />
                                                {msg.chatSession.name || 'Chat'}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-zinc-400 ml-auto">
                                            {new Date(msg.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                                        {highlightText(msg.content, query)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : query && !isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageSquare className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                                No messages found
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Try searching with different keywords
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Search className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                                Search your messages
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Start typing to find messages across all your chats
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
