import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { initSocket } from './socket/socketHandler.js';

dotenv.config();

// Initialize SQLite Tables
initDb();

const app = express();
const server = http.createServer(app);

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://chat-j05f4xk8n-amrith26133-9137s-projects.vercel.app'
    ],
    credentials: true
  })
);

app.use(express.json());

// Initialize Socket.IO
initSocket(server);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chat App Backend API is operational'
  });
});

// Render provides PORT through environment variables
const PORT = process.env.PORT || 5050;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});