import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/chat.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Initialize Tables
export const initDb = () => {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        status TEXT DEFAULT 'Hey there! I am using ChatApp.',
        resetToken TEXT,
        resetTokenExpiry INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conversations table
    db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT DEFAULT 'direct',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conversation Members table
    db.run(`
      CREATE TABLE IF NOT EXISTS conversation_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversationId) REFERENCES conversations(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER NOT NULL,
        senderId INTEGER NOT NULL,
        content TEXT NOT NULL,
        messageType TEXT DEFAULT 'text',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversationId) REFERENCES conversations(id),
        FOREIGN KEY(senderId) REFERENCES users(id)
      )
    `);
  });
};

export default db;
