# ChatApp Pro — Production Real-Time Messaging Platform

ChatApp Pro is an enterprise-grade, full-stack real-time 1-on-1 messaging platform built with **React 19**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **SQLite (WAL Mode)**, and **Socket.IO**.

It delivers WhatsApp-level feature parity—including live message streams, instant typing indicators, online status detection, emoji reactions, message editing, read receipts (blue ticks), deep-linking chat URLs, and session management—housed within a hardened production architecture.

---

## ⚡ Technical Highlights & Security Features

- **Dual-Layer Real-Time & Persistence Architecture**:
  - **Socket.IO Protocol**: Operates instant bi-directional events for live message delivery, read receipts, and presence detection.
  - **SQLite Engine (WAL Mode)**: Enforces Write-Ahead Logging (`PRAGMA journal_mode = WAL;`), foreign key cascading, and performance indexes for transactional persistence.
- **Advanced Token Security**:
  - **HttpOnly Refresh Cookies**: 7-day refresh tokens stored in `HttpOnly`, `SameSite=Lax` cookies to prevent XSS token theft.
  - **In-Memory Access Tokens**: 15-minute JWT Access Tokens kept strictly in React application state.
  - **Transparent 401 Interceptors**: `client.js` automatically catches expired access tokens and executes background refresh rotation without logging out the user.
- **Session Revocation ("Logout All Devices")**: Tracked sessions in `user_sessions` enable users to invalidate all active logins across browsers simultaneously.
- **Zod Schema Validation**: Strict input validation on registration, login, message creation, user search, profile updates, and password changes.
- **Defense-in-Depth Protection**: Express **Helmet** security headers, request body limits (`1mb`), strict CORS policies, and multi-tier **Rate Limiting** (`express-rate-limit`).
- **Standardized Error Handling**: Centralized error middleware ensures internal database or stack trace details are never exposed to clients.
- **Deep Link Navigation**: Built with **React Router DOM** supporting dynamic direct URLs (`/app/chats/:chatId`, `/app/contacts`, `/app/starred`, `/app/settings`).

---

## 🏗️ Architecture Blueprint

```
+-------------------------------------------------------------------+
|                        React 19 Frontend                          |
|    Vite + Tailwind CSS + React Router DOM + Socket.IO Client      |
+---------------------------------+---------------------------------+
                                  |
            HTTP/REST (Axios/Fetch) | WebSockets (Socket.IO)
         (Access Token / Cookies) | (Real-Time Events)
                                  |
+---------------------------------v---------------------------------+
|                        Node.js / Express                          |
|   Helmet + Rate Limiting + Zod Validation + JWT Auth + CORS      |
+---------------------------------+---------------------------------+
                                  |
            SQLite3 Database      | Socket Event Handlers
            (WAL Mode + PRAGMA)   | (In-Memory Room Routing)
+---------------------------------v---------------------------------+
|                       SQLite Database File                        |
|   users | conversations | conversation_members | messages | ...   |
+-------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```
Chat-App/
├── UI/                              # Frontend React 19 Application
│   ├── src/
│   │   ├── api/client.js            # Fetch wrapper with 401 refresh interceptors
│   │   ├── components/
│   │   │   ├── auth/                # AuthPage, Login, Register, Forgot Password
│   │   │   ├── chat/                # ChatScreen, ChatSidebar, ChatWindow, ContactDrawer
│   │   │   ├── contacts/            # ContactsPage grid & discovery
│   │   │   ├── layout/              # NavDock vertical sidebar navigation
│   │   │   ├── settings/            # SettingsPage, Profile updates, Session revocation
│   │   │   └── starred/             # StarredPage bookmarked messages
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Global Auth, Session & Token state
│   │   │   └── SocketContext.jsx    # Real-time WebSocket connection engine
│   │   ├── App.jsx                  # React Router routes (/app/chats/:chatId, etc.)
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── Backend/                         # Backend Express & Socket.IO Application
    ├── API.md                       # Complete REST & Socket.IO specification
    ├── config/db.js                 # SQLite WAL mode, PRAGMAs, & Schema initialization
    ├── controllers/                 # authController, messageController, userController
    ├── middleware/                  # auth, errorHandler, rateLimiter, validate
    ├── routes/                      # authRoutes, messageRoutes, userRoutes, chatRoutes
    ├── socket/socketHandler.js      # Socket.IO handshake, typing, presence, reactions
    ├── tests/                       # Jest & Supertest automated unit test suite
    ├── validation/schemas.js        # Zod validation schemas
    ├── server.js                    # Express app entry point
    └── package.json
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Backend Setup
```bash
cd Backend
npm install
npm run dev
```
The backend server will start on `http://localhost:5050` (or `5051` if 5050 is in use).

### 2. Frontend Setup
```bash
cd UI
npm install
npm run dev
```
The frontend application will boot up at `http://localhost:5173`.

### 3. Running Automated Tests
```bash
cd Backend
npm test
```

---

## 🔑 Environment Variables (`Backend/.env`)

```env
PORT=5050
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_super_secret_access_jwt_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_jwt_key
NODE_ENV=development
```

---

## 📖 API & Socket.IO Reference
For complete documentation on REST endpoints, request payloads, rate limits, and Socket.IO events, refer to [Backend/API.md](file:///Users/amrith/My%20projects/Chat-App/Backend/API.md).
