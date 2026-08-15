import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = Boolean(process.env.DATABASE_URL);
let dbWrapper = {};

if (isPostgres) {
  console.log('🐘 Connecting to PostgreSQL Database via DATABASE_URL...');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const convertPlaceholders = (sql) => {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  };

  const normalizeRow = (row) => {
    if (!row || typeof row !== 'object') return row;
    const normalized = {};
    for (const key of Object.keys(row)) {
      normalized[key] = row[key];
      if (key === 'fullname') normalized.fullName = row[key];
      if (key === 'resettoken') normalized.resetToken = row[key];
      if (key === 'resettokenexpiry') normalized.resetTokenExpiry = row[key];
      if (key === 'createdat') normalized.createdAt = row[key];
      if (key === 'conversationid') normalized.conversationId = row[key];
      if (key === 'userid') normalized.userId = row[key];
      if (key === 'senderid') normalized.senderId = row[key];
      if (key === 'messagetype') normalized.messageType = row[key];
      if (key === 'replytoid') normalized.replyToId = row[key];
      if (key === 'isforwarded') normalized.isForwarded = row[key];
      if (key === 'isedited') normalized.isEdited = row[key];
      if (key === 'isdeleted') normalized.isDeleted = row[key];
      if (key === 'readat') normalized.readAt = row[key];
      if (key === 'contactid') normalized.contactId = row[key];
      if (key === 'lastmessage') normalized.lastMessage = row[key];
      if (key === 'lastmessagetime' || key === 'lastmsgtime') normalized.lastMessageTime = row[key];
      if (key === 'emailverified') normalized.emailVerified = row[key];
    }
    return normalized;
  };

  dbWrapper = {
    isPostgres: true,
    get: (sql, params = [], cb) => {
      const callback = typeof params === 'function' ? params : cb;
      const queryParams = Array.isArray(params) ? params : [];
      const pgSql = convertPlaceholders(sql);

      pool.query(pgSql, queryParams, (err, res) => {
        const row = res && res.rows ? normalizeRow(res.rows[0]) : null;
        if (callback) callback(err, row);
      });
    },

    all: (sql, params = [], cb) => {
      const callback = typeof params === 'function' ? params : cb;
      const queryParams = Array.isArray(params) ? params : [];
      const pgSql = convertPlaceholders(sql);

      pool.query(pgSql, queryParams, (err, res) => {
        const rows = res && res.rows ? res.rows.map(normalizeRow) : [];
        if (callback) callback(err, rows);
      });
    },

    run: (sql, params = [], cb) => {
      const callback = typeof params === 'function' ? params : cb;
      const queryParams = Array.isArray(params) ? params : [];
      
      let pgSql = convertPlaceholders(sql);
      const isInsert = /^\s*INSERT\s+INTO/i.test(sql);

      if (isInsert && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }

      pool.query(pgSql, queryParams, (err, res) => {
        const lastID = (res && res.rows && res.rows[0]) ? res.rows[0].id : null;
        if (callback) {
          callback.call({ lastID }, err);
        }
      });
    },

    prepare: (sql) => ({
      run: (params, cb) => dbWrapper.run(sql, params, cb),
      get: (params, cb) => dbWrapper.get(sql, params, cb),
      all: (params, cb) => dbWrapper.all(sql, params, cb)
    }),

    serialize: (fn) => {
      if (fn) fn();
    }
  };
} else {
  console.log('📦 Connecting to Local SQLite Database...');
  const dbDir = path.resolve(__dirname, '../database');
  const dbPath = path.join(dbDir, 'chat.sqlite');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database at:', dbPath);
    }
  });

  // Enable WAL Mode, Foreign Keys & Busy Timeout for SQLite Production Reliability
  sqliteDb.serialize(() => {
    sqliteDb.run('PRAGMA foreign_keys = ON;');
    sqliteDb.run('PRAGMA journal_mode = WAL;');
    sqliteDb.run('PRAGMA busy_timeout = 5000;');
  });

  dbWrapper = {
    isPostgres: false,
    get: sqliteDb.get.bind(sqliteDb),
    all: sqliteDb.all.bind(sqliteDb),
    run: sqliteDb.run.bind(sqliteDb),
    prepare: (sql) => ({
      run: (params, cb) => sqliteDb.run(sql, params, cb),
      get: (params, cb) => sqliteDb.get(sql, params, cb),
      all: (params, cb) => sqliteDb.all(sql, params, cb)
    }),
    serialize: sqliteDb.serialize.bind(sqliteDb)
  };
}

// Initialize Database Tables, Constraints & Indexes
export const initDb = () => {
  if (isPostgres) {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        status TEXT DEFAULT 'Hey there! I am using ChatApp.',
        emailVerified BOOLEAN DEFAULT FALSE,
        resetToken TEXT,
        resetTokenExpiry BIGINT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) DEFAULT 'direct',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS conversation_members (
        id SERIAL PRIMARY KEY,
        conversationId INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversationId INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        senderId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        messageType VARCHAR(50) DEFAULT 'text',
        replyToId INTEGER,
        isForwarded BOOLEAN DEFAULT FALSE,
        isEdited BOOLEAN DEFAULT FALSE,
        isDeleted BOOLEAN DEFAULT FALSE,
        readAt TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        messageId INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(10) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tokenHash VARCHAR(255) NOT NULL,
        userAgent TEXT,
        ipAddress VARCHAR(45),
        isRevoked BOOLEAN DEFAULT FALSE,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tokenHash VARCHAR(255) NOT NULL,
        isUsed BOOLEAN DEFAULT FALSE,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS favorite_chats (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        conversationId INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, conversationId)
      );`,

      `CREATE TABLE IF NOT EXISTS deleted_messages_for_user (
        id SERIAL PRIMARY KEY,
        messageId INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(messageId, userId)
      );`
    ];

    queries.forEach((q) => {
      dbWrapper.run(q, [], (err) => {
        if (err) console.error('PostgreSQL Table Init Error:', err.message);
      });
    });

    const alterQueries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Hey there! I am using ChatApp.';`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS resetToken TEXT;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS resetTokenExpiry BIGINT;`,
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS replyToId INTEGER;`,
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS isForwarded BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS isEdited BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS isDeleted BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS readAt TIMESTAMP;`
    ];

    alterQueries.forEach((q) => {
      dbWrapper.run(q, [], () => {});
    });
  } else {
    // SQLite Table Schemas with Foreign Keys & Indexes
    dbWrapper.serialize(() => {
      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fullName TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar TEXT,
          status TEXT DEFAULT 'Hey there! I am using ChatApp.',
          emailVerified INTEGER DEFAULT 0,
          resetToken TEXT,
          resetTokenExpiry INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT DEFAULT 'direct',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS conversation_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversationId INTEGER NOT NULL,
          userId INTEGER NOT NULL,
          joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversationId INTEGER NOT NULL,
          senderId INTEGER NOT NULL,
          content TEXT NOT NULL,
          messageType TEXT DEFAULT 'text',
          replyToId INTEGER,
          isForwarded INTEGER DEFAULT 0,
          isEdited INTEGER DEFAULT 0,
          isDeleted INTEGER DEFAULT 0,
          readAt DATETIME,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
          FOREIGN KEY(senderId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS message_reactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          messageId INTEGER NOT NULL,
          userId INTEGER NOT NULL,
          emoji TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(messageId) REFERENCES messages(id) ON DELETE CASCADE,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          tokenHash TEXT NOT NULL,
          userAgent TEXT,
          ipAddress TEXT,
          isRevoked INTEGER DEFAULT 0,
          expiresAt DATETIME NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          tokenHash TEXT NOT NULL,
          isUsed INTEGER DEFAULT 0,
          expiresAt DATETIME NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS favorite_chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          conversationId INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(userId, conversationId),
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY(conversationId) REFERENCES conversations(id) ON DELETE CASCADE
        )
      `);

      dbWrapper.run(`
        CREATE TABLE IF NOT EXISTS deleted_messages_for_user (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          messageId INTEGER NOT NULL,
          userId INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(messageId, userId),
          FOREIGN KEY(messageId) REFERENCES messages(id) ON DELETE CASCADE,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Migrations & Columns Addition
      dbWrapper.run(`ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0`, [], () => {});
      dbWrapper.run(`ALTER TABLE messages ADD COLUMN replyToId INTEGER`, [], () => {});
      dbWrapper.run(`ALTER TABLE messages ADD COLUMN isForwarded INTEGER DEFAULT 0`, [], () => {});
      dbWrapper.run(`ALTER TABLE messages ADD COLUMN isEdited INTEGER DEFAULT 0`, [], () => {});
      dbWrapper.run(`ALTER TABLE messages ADD COLUMN isDeleted INTEGER DEFAULT 0`, [], () => {});
      dbWrapper.run(`ALTER TABLE messages ADD COLUMN readAt DATETIME`, [], () => {});

      // Performance Indexing
      dbWrapper.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      dbWrapper.run(`CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(userId)`);
      dbWrapper.run(`CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversationId)`);
      dbWrapper.run(`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversationId)`);
      dbWrapper.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId)`);
      dbWrapper.run(`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt)`);
      dbWrapper.run(`CREATE INDEX IF NOT EXISTS idx_reactions_msg ON message_reactions(messageId)`);
      dbWrapper.run(`CREATE INDEX IF NOT EXISTS idx_del_msg_user ON deleted_messages_for_user(messageId, userId)`);
    });
  }
};

export default dbWrapper;
