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

// CORS configuration to support localhost, Vercel frontend, and environment variables
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or allowed origins
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive CORS for smooth deployment across Vercel / Render
      }
    },
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

const startServer = (portToTry) => {
  server.listen(portToTry, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${portToTry}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${portToTry} is in use, retrying on port ${Number(portToTry) + 1}...`);
      startServer(Number(portToTry) + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(PORT);