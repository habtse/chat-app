'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { Search, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

interface MessageSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectMessage: (sessionId: string, messageId: string) => void;
}

export function MessageSearchDialog({ open, onOpenChange, onSelectMessage }: MessageSearchDialogProps) {
    const { accessToken } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !accessToken) return;

        setIsLoading(true);
        try {
            const data = await apiClient.searchMessages(query, accessToken);
            setResults(data);
        } catch (error) {
            console.error('Failed to search messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Search Messages</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for messages..."
                        className="flex-1"
                    />
                    <button type="submit" className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        <Search className="h-4 w-4" />
                    </button>
                </form>

                <ScrollArea className="h-[300px] mt-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-2">
                            {results.map((msg) => (
                                <div
                                    key={msg.id}
                                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => {
                                        onSelectMessage(msg.chatSessionId, msg.id);
                                        onOpenChange(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={msg.sender.profilePicUrl} />
                                            <AvatarFallback>{msg.sender.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-semibold">{msg.sender.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2">{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : query && !isLoading ? (
                        <div className="text-center py-8 text-gray-500">
                            No messages found.
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
