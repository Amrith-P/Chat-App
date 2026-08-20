// ChatApp Pro Backend Server - Real-Time API Engine v1.0.5
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDb } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import { initSocket } from './socket/socketHandler.js';
import { refreshTokenHandler } from './controllers/authController.js';
import { deleteChat, clearChatMessages } from './controllers/chatController.js';
import { clearMessagesByChatId } from './controllers/messageController.js';
import { protect } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateEnv } from './config/validateEnv.js';

dotenv.config();
validateEnv();

// Initialize Database
initDb();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Universal Manual CORS Header Injector (Guarantees Access-Control-Allow-Origin on all responses & preflights)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Cookie Parser Middleware
app.use(cookieParser());

// CORS configuration to support localhost, Vercel frontend, and environment variables
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman) or any Vercel domain / allowed origins
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (typeof origin === 'string' && (origin.endsWith('.vercel.app') || origin.includes('vercel.app')))
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback to prevent CORS preflight blocking on preview URLs
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security Headers with Helmet (configured after CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  })
);

// Body Parsers with Size Limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply General Rate Limiter to API
app.use('/api', apiLimiter);

// Initialize Socket.IO
initSocket(server);

// Top-Level Auth Refresh Handler Fallback
app.post('/api/auth/refresh', refreshTokenHandler);

// Top-Level Explicit Clear Chat Routes (POST & DELETE)
app.delete('/api/chats/:chatId/messages', protect, clearChatMessages);
app.post('/api/chats/:chatId/messages/clear', protect, clearChatMessages);
app.post('/api/chats/:chatId/clear', protect, clearChatMessages);
app.delete('/api/messages/chat/:chatId', protect, clearMessagesByChatId);
app.post('/api/messages/chat/:chatId/clear', protect, clearMessagesByChatId);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/friend-requests', friendRoutes);

// Health Check Endpoint (Verifies API, Uptime & Active DB Connection)
app.get('/api/health', (req, res) => {
  db.get('SELECT 1', [], (err) => {
    if (err) {
      console.error('🚨 Health Check DB Error:', err);
      return res.status(500).json({
        status: 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: err.message
      });
    }

    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  });
});

// Centralized Global Error Handler Middleware
app.use(errorHandler);

// Render/Local Port Handling
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