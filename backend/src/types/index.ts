import { Request } from 'express';

// --- User Types ---
export interface UserPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// --- Auth Types ---
export interface RegisterDTO {
  email: string;
  name: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    profilePicUrl: string | null;
  };
}

// --- Session Types ---
export interface CreateSessionDTO {
  isGroup: boolean;
  name?: string;
  memberIds: string[];
  categoryId?: string;
}

export interface AddMemberDTO {
  userId: string;
}

// --- Message Types ---
export interface SendMessageDTO {
  sessionId: string;
  content: string;
}

// --- Category Types ---
export interface CreateCategoryDTO {
  name: string;
}

// --- WebSocket Message Types ---
export type WSMessageType = 
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

export interface WSMessage {
  type: WSMessageType;
  payload?: any;
}

export interface WSError {
  code: string;
  message: string;
}
