import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Define the structure for a connected client
interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
}

// Map to store connected users and their WebSocket connections
const connectedUsers = new Map<string, AuthenticatedWebSocket>();

// Map to store session subscriptions (userId -> Set<sessionId>)
const sessionSubscriptions = new Map<string, Set<string>>();

// --- WebSocket Initialization ---
export function initWebSocketServer(server: HttpServer, prisma: PrismaClient) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request) => {
    console.log('New WebSocket connection established.');

    // Handle initial connection and authentication
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'CONNECT' && data.token) {
          await handleConnect(ws, data.token, prisma);
        } else if ((ws as AuthenticatedWebSocket).userId) {
          // Handle authenticated messages
          await handleAuthenticatedMessage(ws as AuthenticatedWebSocket, data, prisma);
        } else {
          sendError(ws, 'AUTH_REQUIRED', 'Authentication required. Send CONNECT message with token.');
          ws.close();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        sendError(ws, 'INVALID_MESSAGE', 'Invalid message format or internal error.');
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws, prisma);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      handleDisconnect(ws, prisma);
    });
  });
}

// --- Handlers ---

async function handleConnect(ws: WebSocket, token: string, prisma: PrismaClient) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    // 1. Associate userId with WebSocket
    (ws as AuthenticatedWebSocket).userId = userId;
    connectedUsers.set(userId, ws as AuthenticatedWebSocket);

    // 2. Update user status in DB
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });

    // 3. Broadcast status update (LogicDocument 1.1)
    broadcastStatusUpdate(userId, true);

    console.log(`User ${userId} connected and authenticated.`);
  } catch (error) {
    sendError(ws, 'AUTH_FAILED', 'Invalid or expired token.');
    ws.close();
  }
}

async function handleDisconnect(ws: WebSocket, prisma: PrismaClient) {
  const userId = (ws as AuthenticatedWebSocket).userId;
  if (userId) {
    connectedUsers.delete(userId);
    sessionSubscriptions.delete(userId);

    // Update user status in DB
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false },
    });

    // Broadcast status update
    broadcastStatusUpdate(userId, false);
    console.log(`User ${userId} disconnected.`);
  }
}

async function handleAuthenticatedMessage(ws: AuthenticatedWebSocket, data: any, prisma: PrismaClient) {
  const userId = ws.userId;
  const { type, payload } = data;

  switch (type) {
    case 'SEND_MESSAGE':
      await handleSendMessage(userId, payload, prisma);
      break;
    case 'JOIN_SESSION':
      handleJoinSession(userId, payload.sessionId);
      break;
    case 'LEAVE_SESSION':
      handleLeaveSession(userId, payload.sessionId);
      break;
    case 'TYPING_START':
    case 'TYPING_STOP':
      broadcastTypingIndicator(userId, payload.sessionId, type === 'TYPING_START');
      break;
    case 'MARK_READ':
      // Implementation for MARK_READ (Bonus B3)
      break;
    default:
      sendError(ws, 'UNKNOWN_TYPE', `Unknown message type: ${type}`);
  }
}

// --- Core Logic Functions ---

async function handleSendMessage(senderId: string, payload: { sessionId: string, content: string }, prisma: PrismaClient) {
  const { sessionId, content } = payload;

  // 1. Validate user membership (Simplified check for MVP)
  const isMember = await prisma.groupMember.findUnique({
    where: {
      userId_chatSessionId: {
        userId: senderId,
        chatSessionId: sessionId,
      },
    },
  });

  if (!isMember) {
    // Handle error: user is not a member of the session
    return;
  }

  // 2. Persist message to DB
  const newMessage = await prisma.message.create({
    data: {
      content,
      senderId,
      chatSessionId: sessionId,
    },
    include: {
      sender: {
        select: { id: true, name: true, profilePicUrl: true }
      }
    }
  });

  // 3. Check for AI session (Bonus B2)
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      members: {
        include: { user: true }
      }
    }
  });

  const aiUser = session?.members.find(m => m.user.email === 'ai@shipper.chat');

  if (aiUser && aiUser.userId !== senderId) {
    // This is a message to the AI. Trigger AI response logic.
    triggerAIResponse(sessionId, newMessage, prisma).catch(err => {
      console.error('AI response error:', err);
    });
  }

  // 4. Broadcast NEW_MESSAGE
  broadcastMessage(sessionId, newMessage);
}

// Trigger AI response (Bonus B2)
async function triggerAIResponse(sessionId: string, userMessage: any, prisma: PrismaClient) {
  try {
    // Import AI service
    const { generateAIResponse, formatConversationHistory } = await import('../services/ai.service');
    const { getOrCreateAIUser } = await import('../controllers/ai.controller');

    // Get conversation history
    const recentMessages = await prisma.message.findMany({
      where: { chatSessionId: sessionId },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const conversationHistory = formatConversationHistory(recentMessages.reverse());

    // Generate AI response
    const aiResponseText = await generateAIResponse(userMessage.content, conversationHistory);

    // Get AI user
    const aiUser = await getOrCreateAIUser();

    // Save AI response to database
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponseText,
        senderId: aiUser.id,
        chatSessionId: sessionId,
      },
      include: {
        sender: {
          select: { id: true, name: true, profilePicUrl: true }
        }
      }
    });

    // Broadcast AI response
    setTimeout(() => {
      broadcastMessage(sessionId, aiMessage);
    }, 1000); // Small delay to simulate typing

  } catch (error) {
    console.error('Failed to generate AI response:', error);
  }
}

function handleJoinSession(userId: string, sessionId: string) {
  if (!sessionSubscriptions.has(userId)) {
    sessionSubscriptions.set(userId, new Set());
  }
  sessionSubscriptions.get(userId)?.add(sessionId);
  console.log(`User ${userId} joined session ${sessionId}`);
}

function handleLeaveSession(userId: string, sessionId: string) {
  sessionSubscriptions.get(userId)?.delete(sessionId);
  console.log(`User ${userId} left session ${sessionId}`);
}

// --- Broadcast Functions ---

function broadcastStatusUpdate(userId: string, isOnline: boolean) {
  const message = JSON.stringify({
    type: 'USER_STATUS_UPDATE',
    payload: { userId, isOnline },
  });

  // Broadcast to all connected users
  connectedUsers.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function broadcastMessage(sessionId: string, message: any) {
  const messageToSend = JSON.stringify({
    type: 'NEW_MESSAGE',
    payload: {
      messageId: message.id,
      sessionId: message.chatSessionId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      senderName: message.sender.name,
    },
  });

  // Broadcast to all users subscribed to this session
  connectedUsers.forEach(ws => {
    const userId = ws.userId;
    if (sessionSubscriptions.get(userId)?.has(sessionId) && ws.readyState === WebSocket.OPEN) {
      ws.send(messageToSend);
    }
  });
}

function broadcastTypingIndicator(userId: string, sessionId: string, isTyping: boolean) {
  const message = JSON.stringify({
    type: 'TYPING_INDICATOR',
    payload: { sessionId, userId, isTyping },
  });

  // Broadcast to all users subscribed to this session, excluding the sender
  connectedUsers.forEach(ws => {
    const subscriberId = ws.userId;
    if (subscriberId !== userId && sessionSubscriptions.get(subscriberId)?.has(sessionId) && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// --- Utility Functions ---

function sendError(ws: WebSocket, code: string, message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { code, message },
    }));
  }
}
