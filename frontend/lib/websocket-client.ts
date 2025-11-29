type WSMessageType =
    | 'CONNECT'
    | 'SEND_MESSAGE'
    | 'JOIN_SESSION'
    | 'LEAVE_SESSION'
    | 'TYPING_START'
    | 'TYPING_STOP'
    | 'MARK_READ'
    | 'USER_STATUS_UPDATE'
    | 'NEW_MESSAGE'
    | 'TYPING_INDICATOR'
    | 'ERROR';

interface WSMessage {
    type: WSMessageType;
    payload?: any;
}

type MessageHandler = (data: any) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private messageHandlers: Map<WSMessageType, Set<MessageHandler>> = new Map();
    private isIntentionallyClosed = false;

    constructor(url: string) {
        this.url = url;
    }

    connect(token: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        this.token = token;
        this.isIntentionallyClosed = false;

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;

                // Send authentication message
                this.send({
                    type: 'CONNECT',
                    token,
                } as any);
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WSMessage = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.ws = null;

                // Attempt to reconnect if not intentionally closed
                if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => {
                        if (this.token) {
                            this.connect(this.token);
                        }
                    }, this.reconnectDelay * this.reconnectAttempts);
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }

    disconnect() {
        this.isIntentionallyClosed = true;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    send(message: WSMessage) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    // Message handlers
    on(type: WSMessageType, handler: MessageHandler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type)!.add(handler);
    }

    off(type: WSMessageType, handler: MessageHandler) {
        this.messageHandlers.get(type)?.delete(handler);
    }

    private handleMessage(message: WSMessage) {
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
            handlers.forEach((handler) => handler(message.payload));
        }
    }

    // Convenience methods
    sendMessage(sessionId: string, content: string) {
        this.send({
            type: 'SEND_MESSAGE',
            payload: { sessionId, content },
        });
    }

    joinSession(sessionId: string) {
        this.send({
            type: 'JOIN_SESSION',
            payload: { sessionId },
        });
    }

    leaveSession(sessionId: string) {
        this.send({
            type: 'LEAVE_SESSION',
            payload: { sessionId },
        });
    }

    startTyping(sessionId: string) {
        this.send({
            type: 'TYPING_START',
            payload: { sessionId },
        });
    }

    stopTyping(sessionId: string) {
        this.send({
            type: 'TYPING_STOP',
            payload: { sessionId },
        });
    }

    markAsRead(messageId: string) {
        this.send({
            type: 'MARK_READ',
            payload: { messageId },
        });
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
export const wsClient = new WebSocketClient(WS_URL);
