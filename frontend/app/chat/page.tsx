'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { ChatSidebar } from '../../components/chat/chat-sidebar';
import { ChatWindow } from '../../components/chat/chat-window';
import { apiClient } from '../../lib/api-client';

export default function ChatPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, isLoading, router]);

    const handleSelectUser = async (userId: string) => {
        // Check if we already have a chat with this user
        // Ideally backend should handle "get or create" logic, but for now we can try to create
        // and if it exists, the backend might return existing or we handle it.
        // Our backend createSession logic for 1-on-1 checks for existing sessions.

        if (!user) return;

        try {
            const session = await apiClient.createSession({
                isGroup: false,
                memberIds: [userId],
            }, localStorage.getItem('accessToken') || ''); // Direct access for speed, though context has it

            setCurrentSessionId(session.id);
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <ChatSidebar
                currentSessionId={currentSessionId}
                onSelectSession={setCurrentSessionId}
                onSelectUser={handleSelectUser}
            />

            {currentSessionId ? (
                <ChatWindow sessionId={currentSessionId} />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Shipper Chat</h2>
                    <p className="max-w-md text-center">
                        Select a conversation from the sidebar or start a new one to begin messaging.
                    </p>
                </div>
            )}
        </div>
    );
}
