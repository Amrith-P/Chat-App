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

  // Convert ? placeholders to $1, $2, $3 for Postgres
  const convertPlaceholders = (sql) => {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  };

  dbWrapper = {
    isPostgres: true,
    get: (sql, params = [], cb) => {
      const callback = typeof params === 'function' ? params : cb;
      const queryParams = Array.isArray(params) ? params : [];
      const pgSql = convertPlaceholders(sql);

      pool.query(pgSql, queryParams, (err, res) => {
        if (callback) callback(err, res ? res.rows[0] : null);
      });
    },

    all: (sql, params = [], cb) => {
      const callback = typeof params === 'function' ? params : cb;
      const queryParams = Array.isArray(params) ? params : [];
      const pgSql = convertPlaceholders(sql);

      pool.query(pgSql, queryParams, (err, res) => {
        if (callback) callback(err, res ? res.rows : []);
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

  dbWrapper = {
    isPostgres: false,
    get: sqliteDb.get.bind(sqliteDb),
    all: sqliteDb.all.bind(sqliteDb),
    run: sqliteDb.run.bind(sqliteDb),
    serialize: sqliteDb.serialize.bind(sqliteDb)
  };
}

// Initialize Database Tables
export const initDb = () => {
  if (isPostgres) {
    // PostgreSQL Table Schemas
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        status TEXT DEFAULT 'Hey there! I am using ChatApp.',
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
        conversationId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversationId INTEGER NOT NULL,
        senderId INTEGER NOT NULL,
        content TEXT NOT NULL,
        messageType VARCHAR(50) DEFAULT 'text',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    ];

    queries.forEach((q) => {
      dbWrapper.run(q, [], (err) => {
        if (err) console.error('PostgreSQL Table Init Error:', err.message);
      });
    });
  } else {
    // SQLite Table Schemas
    dbWrapper.serialize(() => {
      dbWrapper.run(`
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
          FOREIGN KEY(conversationId) REFERENCES conversations(id),
          FOREIGN KEY(userId) REFERENCES users(id)
        )
      `);

      dbWrapper.run(`
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
  }
};

export default dbWrapper;
