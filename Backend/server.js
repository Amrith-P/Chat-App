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
import { initSocket } from './socket/socketHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Initialize Database
initDb();

const app = express();
const server = http.createServer(app);

// Security Headers with Helmet
app.use(helmet());

// Cookie Parser Middleware
app.use(cookieParser());

// CORS configuration to support localhost, Vercel frontend, and environment variables
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) or matched allowed origins
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('CORS Policy: Request origin not allowed'));
      }
    },
    credentials: true
  })
);

// Body Parsers with Size Limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply General Rate Limiter to API
app.use('/api', apiLimiter);

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
    timestamp: new Date().toISOString(),
    message: 'Chat App Backend API is operational',
    env: process.env.NODE_ENV || 'development'
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