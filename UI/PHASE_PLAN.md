# Real-Time Chat App - Phase & Day-by-Day Implementation Plan

## Executive Summary
This document serves as the master execution plan for building a full-stack, real-time messaging application. The architecture is split into a **React + Tailwind CSS** frontend in `/UI` and a **Node.js + Express + SQLite + Socket.IO** backend in `/Backend`.

---

## Technical Stack & Architecture

- **Frontend (`/UI`)**: React 19, Vite, Tailwind CSS v4, React Icons / Lucide Icons, Socket.IO Client.
- **Backend (`/Backend`)**: Node.js, Express, SQLite3 / Better-SQLite3, Socket.IO, JSON Web Tokens (JWT in `localStorage`), BcryptJS for password hashing.
- **Real-Time Communication**: Socket.IO events for live messaging, typing indicators, and user online/offline status.
- **Messaging Focus**: 1-on-1 direct user messaging.

---

## Master Roadmap: Phase-by-Phase & Day-by-Day

### Phase 1: Directory Restructuring & Environment Initialization (Day 1)
- [x] Partition repository into `UI/` and `Backend/` directories.
- [x] Move existing frontend files (`src/`, `public/`, `package.json`, etc.) into `UI/`.
- [x] Create `UI/PHASE_PLAN.md` documenting the phase-by-phase roadmap.
- [x] Initialize `Backend/` directory with `package.json`, `.env`, `server.js`, and folder sub-structures (`config/`, `controllers/`, `routes/`, `middleware/`, `socket/`, `database/`).
- [x] Install backend dependencies (`express`, `cors`, `dotenv`, `sqlite3`, `jsonwebtoken`, `bcryptjs`, `socket.io`, `nodemon`).

### Phase 2: Backend Architecture & Database Engine (Days 2 - 3)
- **Day 2: Database Schema & Authentication APIs**
  - [x] Configure `Backend/config/db.js` with SQLite connection and table creation scripts (`users`, `conversations`, `conversation_members`, `messages`).
  - [x] Implement `/api/auth/register` with validation and password hashing (`bcryptjs`).
  - [x] Implement `/api/auth/login` returning JWT token and user details.
  - [x] Implement `/api/auth/forgot-password` and `/api/auth/reset-password`.
  - [x] Write Auth Middleware (`Backend/middleware/auth.js`) to protect routes using Bearer token verification.
  - [x] Implement `/api/auth/me` to get active user session details.
- **Day 3: User Search, Chat & Message Endpoints + Socket.IO Setup**
  - Implement `/api/users/search?q=` endpoint to discover other registered users.
  - Implement `/api/chats` endpoints to fetch user conversations or initiate a 1-on-1 chat.
  - Implement `/api/messages/:chatId` to fetch historical chat messages.
  - Setup Socket.IO server (`Backend/socket/socketHandler.js`) with JWT handshake authentication, connection tracking, typing notifications, and real-time message broadcasting.

### Phase 3: Next-Gen 2-Sectioned Auth UI (Days 4 - 5)
- **Day 4: Two-Section Split Authentication Screen**
  - [x] **Left Hero Panel**: Dynamic dark/gradient design, ambient background glow, feature highlights, and brand presentation.
  - [x] **Right Form Panel**: Tab switcher between Login, Register, Forgot Password, and Reset Password, styled input fields, email format validation, error/success alert banners, password visibility toggle, quick 1-click Demo Login, and loading states.
- **Day 5: Frontend Auth State & API Client Integration**
  - [x] Create API wrapper (`UI/src/api/client.js`) configured with base URLs and automatic `localStorage` Bearer token headers.
  - [x] Build `AuthContext.jsx` for global user authentication state, token initialization, login/logout functions, and automatic session restoration.
  - [x] Implement seamless transition to `ChatScreen.jsx` upon successful login.

### Phase 4: Modern 1-on-1 Chat Interface Suite (Days 6 - 7)
- **Day 6: Vertical Dock & Chat Sidebar**
  - [x] **Navigation Dock (`NavDock.jsx`)**: Sleek left sidebar featuring brand logo, user avatar with online dot badge, navigation tabs (Chats, Contacts, Starred, Settings), theme toggle, and logout trigger.
  - [x] **Chat List Panel (`ChatSidebar.jsx`)**: User search bar triggering a User Discovery modal, category filter pills (All, Unread, Favorites), conversation cards displaying contact avatar, online/offline indicator, last message snippet, timestamp, double-tick checkmark, and unread count badge.
- **Day 7: Active Chat Window & Message Features**
  - [x] **Chat Header (`ChatWindow.jsx`)**: Active contact details, online/typing status badge, audio/video call controls, in-chat search, and slide-out contact info drawer toggle.
  - [x] **Message Thread (`ChatWindow.jsx`)**: Date dividers ("Today"), message bubble formatting (sent right vs received left), timestamp, double-tick read receipts, animated typing status indicator, and bubble hover menu (reply, copy, delete).
  - [x] **Message Input Bar (`ChatWindow.jsx`)**: Dynamic text input, emoji selector popover, attachment menu (image/document), voice message trigger, and animated send button.
  - [x] **User Discovery Modal (`SearchModal.jsx`)**: Live search of database users (`/api/users/search?q=`) and instant 1-click conversation creation.
  - [x] **Contact Info Drawer (`ContactDrawer.jsx`)**: Slide-out drawer displaying contact status, media gallery, and user action controls.

### Phase 5: Real-Time Connection & End-to-End Verification (Day 8)
- **Day 8: Socket.IO Client Wiring & E2E Validation**
  - Connect Socket.IO client (`SocketContext.jsx`) to backend server with JWT token.
  - Handle live message arrival, updating active message stream and unread counts in real-time.
  - Add optional notification chime sound on new message.
  - Perform dual-browser manual verification (User A in standard window, User B in Incognito) testing instant message exchange, typing states, and persistence upon refresh.

---

## Directory Structure Overview

```
Chat-App/
├── UI/
│   ├── PHASE_PLAN.md
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── AuthPage.jsx
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── chat/
│   │   │   │   ├── Chatbox.jsx
│   │   │   │   ├── Chatlist.jsx
│   │   │   │   ├── ChatHeader.jsx
│   │   │   │   ├── MessageInput.jsx
│   │   │   │   └── MessageList.jsx
│   │   │   └── layout/
│   │   │       └── Navlinks.jsx
│   │   └── Data/
│   └── public/
└── Backend/
    ├── package.json
    ├── server.js
    ├── .env
    ├── database/
    │   └── chat.sqlite
    ├── config/
    │   └── db.js
    ├── middleware/
    │   └── auth.js
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── chatController.js
    │   └── messageController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── chatRoutes.js
    │   └── messageRoutes.js
    └── socket/
        └── socketHandler.js
```
