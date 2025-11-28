import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { initWebSocketServer } from './websocket/ws';
import { PrismaClient } from '@prisma/client';

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const API_PREFIX = '/api/v1';

// --- Initialize App and Server ---
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// --- Middleware ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// --- Routes ---
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import sessionRoutes from './routes/session.routes';
import messageRoutes from './routes/message.routes';
import categoryRoutes from './routes/category.routes';
import aiRoutes from './routes/ai.routes';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/sessions`, sessionRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);

app.get(`${API_PREFIX}/health`, (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'backend-api' });
});

// --- WebSocket Server ---
initWebSocketServer(server, prisma);

// --- Error Handling Middleware (Bonus B8) ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred',
    status: err.status || 500,
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Express API server running on port ${PORT}`);
  console.log(`WebSocket server running on port ${PORT} at /ws`);
});

// Export prisma client for use in other modules
export { prisma };
