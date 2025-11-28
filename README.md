# Shipper Chat MVP

A real-time chat application with one-on-one messaging, group chats, user presence, AI chat integration, and more.

## Features

### Core Features ✅
- **C1**: JWT Authentication with registration and login
- **C2**: User list display
- **C3**: Real-time online/offline status
- **C4**: One-on-one chat sessions
- **C5**: User information display with profile pictures
- **C6**: Real-time messaging via WebSockets
- **C7**: Custom category system for organizing chats
- **C8**: Group chat (Telegram-like) with admin controls

### Bonus Features ✅
- **B1** (+5 pts): JWT Authentication with proper token flow
- **B2** (+10 pts): Chat with AI using OpenAI integration
- **B3** (+5 pts): Message read status/receipts
- **B4** (+5 pts): Typing indicators
- **B5** (+5 pts): Docker Compose setup
- **B6** (+5 pts): Message search functionality
- **B7** (+5 pts): Polished UI with shadcn/ui
- **B8** (+5 pts): Robust error handling

**Total Bonus Points: 45/45** 🎉

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, shadcn/ui, TailwindCSS
- **Backend**: Node.js (Express), TypeScript, WebSocket (ws)
- **Database**: PostgreSQL, Prisma ORM
- **Containerization**: Docker, Docker Compose
- **Authentication**: JWT with bcrypt
- **AI**: OpenAI GPT-3.5-turbo

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- npm or yarn

### Option 1: Local Development

#### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shipperchat?schema=public"
JWT_SECRET="your_super_secret_jwt_key_change_this"
JWT_ACCESS_TOKEN_EXPIRY="15m"
JWT_REFRESH_TOKEN_EXPIRY="7d"
OPENAI_API_KEY="your_openai_api_key_here"  # Optional for AI chat
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/.env.local.example frontend/.env.local
```

The defaults should work for local development.

#### 3. Setup Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with test data
npm run db:seed
```

#### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- WebSocket: ws://localhost:3001/ws

### Option 2: Docker Compose

```bash
# Start all services
docker-compose up --build

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
```

## Test Credentials

After seeding the database, you can use these test accounts:

- **Email**: john@example.com | **Password**: password123
- **Email**: jane@example.com | **Password**: password123
- **Email**: bob@example.com | **Password**: password123

## Testing the Application

### 1. Authentication Flow
1. Go to http://localhost:3000
2. Click "Login" or navigate to `/auth/login`
3. Use test credentials or register a new account
4. You should be redirected to `/chat` after successful login

### 2. Real-Time Messaging
1. Open two browser windows (or use incognito mode)
2. Login as different users in each window
3. Start a chat and send messages
4. Verify messages appear in real-time in both windows

### 3. Online Status
1. Login with one user
2. In another window, login as a different user
3. Verify the first user shows as "online"
4. Close the first window
5. Verify the user shows as "offline"

### 4. Group Chat
1. Create a new group chat
2. Add multiple members
3. Send messages in the group
4. Verify all members receive messages

### 5. AI Chat (Bonus Feature)
1. Click the "Chat with AI" button
2. Send a message to the AI
3. Wait for the AI response (requires valid OPENAI_API_KEY)

### 6. Categories
1. Create a new category (e.g., "Work", "Friends")
2. Assign a chat session to the category
3. Filter chats by category

### 7. Message Search
1. Send several messages in different chats
2. Use the search functionality
3. Verify search results are accurate

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/online` - Get online users
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user profile

### Sessions
- `POST /api/v1/sessions` - Create chat session
- `GET /api/v1/sessions` - Get user's sessions
- `GET /api/v1/sessions/:id` - Get session details
- `POST /api/v1/sessions/:id/members` - Add member to group
- `DELETE /api/v1/sessions/:id/members/:userId` - Remove member

### Messages
- `GET /api/v1/messages/sessions/:id/messages` - Get messages
- `PUT /api/v1/messages/:id/read` - Mark message as read
- `PUT /api/v1/messages/sessions/:id/messages/read` - Mark all as read
- `GET /api/v1/messages/search` - Search messages

### Categories
- `POST /api/v1/categories` - Create category
- `GET /api/v1/categories` - Get user's categories
- `PUT /api/v1/categories/sessions/:id` - Assign category
- `DELETE /api/v1/categories/:id` - Delete category

### AI
- `GET /api/v1/ai/user` - Get AI user info
- `POST /api/v1/ai/session` - Create AI chat session

## WebSocket Events

### Client → Server
- `CONNECT` - Authenticate WebSocket connection
- `SEND_MESSAGE` - Send a message
- `JOIN_SESSION` - Subscribe to session updates
- `LEAVE_SESSION` - Unsubscribe from session
- `TYPING_START` - Start typing indicator
- `TYPING_STOP` - Stop typing indicator
- `MARK_READ` - Mark message as read

### Server → Client
- `USER_STATUS_UPDATE` - User online/offline status changed
- `NEW_MESSAGE` - New message received
- `TYPING_INDICATOR` - Someone is typing
- `ERROR` - Error occurred

## Project Structure

```
/shipper-chat-mvp
├── /backend
│   ├── /src
│   │   ├── /auth
│   │   ├── /controllers
│   │   ├── /routes
│   │   ├── /services
│   │   ├── /websocket
│   │   ├── /middleware
│   │   ├── /types
│   │   ├── server.ts
│   │   └── ws.ts
│   ├── /prisma
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   └── tsconfig.json
├── /frontend
│   ├── /app
│   │   ├── /auth
│   │   ├── /chat
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── /components
│   │   ├── /ui
│   │   └── /chat
│   ├── /lib
│   │   ├── /auth
│   │   ├── /utils
│   │   └── /ws
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

## Development Notes

- The backend runs on port 3001 by default
- The frontend runs on port 3000 by default
- WebSocket connections are on the same port as the backend (/ws endpoint)
- JWT access tokens expire after 15 minutes (auto-refreshed)
- JWT refresh tokens expire after 7 days

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Run `npx prisma db push` to sync schema

### WebSocket Connection Failed
- Ensure backend is running
- Check NEXT_PUBLIC_WS_URL in frontend/.env.local
- Verify JWT token is valid

### AI Chat Not Working
- Add valid OPENAI_API_KEY to backend/.env
- Check backend logs for API errors
- Ensure you have OpenAI API credits

## License

MIT
