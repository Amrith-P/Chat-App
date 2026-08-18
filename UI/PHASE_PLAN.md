# Comprehensive Production Readiness & Handover Roadmap (ChatApp Pro)

Based on the [checklist.md](file:///Users/amrith/My%20projects/Chat-App/UI/checklist.md) audit, this document breaks down all missing items into **micro-phases** and **small, bite-sized, easily testable steps**.

---

## 🎯 Master Phase Checklist

- [ ] **Phase 1: Environment & Health Foundations**
- [ ] **Phase 2: Security & Authentication Enhancements**
- [ ] **Phase 3: Database & Maintenance Hardening**
- [ ] **Phase 4: Advanced Real-Time Messaging & Features**
- [ ] **Phase 5: Quality Assurance, Unit Testing & Logging**
- [ ] **Phase 6: OpenAPI Documentation & Production Handover**

---

## 📋 Detailed Step-by-Step Implementation Roadmap

### 🔹 Phase 1: Environment & Health Foundations

#### **Step 1.1: Environment Variable Templates & Startup Validation** [COMPLETED ✅]
- **Goal**: Ensure the app never boots with missing secrets or environment configs.
- **Tasks**:
  1. Create `Backend/.env.example` detailing `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CLIENT_URL`.
  2. Create `UI/.env.example` detailing `VITE_API_URL`, `VITE_SOCKET_URL`.
  3. Add startup validator function in `Backend/server.js` that checks `process.env` keys on boot and exits with a clear error if missing.
- **Verification**: Run backend without `.env` to verify clean error startup exit.

#### **Step 1.2: Server Health Check Endpoint (`GET /api/health`)**
- **Goal**: Allow Render, Vercel, and uptime monitors to verify server and database health.
- **Tasks**:
  1. Create `GET /api/health` endpoint in `Backend/server.js`.
  2. Perform a test database query inside `/api/health` to confirm active DB connection.
  3. Return JSON payload: `{ status: 'ok', uptime: process.uptime(), timestamp: Date.now(), database: 'connected' }`.
- **Verification**: `curl http://localhost:10000/api/health` returns `200 OK`.

---

### 🔹 Phase 2: Security & Authentication Enhancements

#### **Step 2.1: Express Security Headers (`helmet`) & CORS Hardening**
- **Goal**: Protect backend against XSS, clickjacking, and header vulnerabilities.
- **Tasks**:
  1. Install `helmet` npm package in `Backend`.
  2. Add `app.use(helmet())` with custom Content Security Policy (CSP) for WebRTC and Socket.IO.
  3. Strict CORS origin check for `CLIENT_URL`.
- **Verification**: Verify HTTP response headers include `X-Frame-Options`, `X-Content-Type-Options`.

#### **Step 2.2: Rate Limiting & Brute-Force Protection**
- **Goal**: Prevent brute-force login and registration spam.
- **Tasks**:
  1. Configure `express-rate-limit` on `POST /api/auth/login` (max 5 attempts per 15 mins).
  2. Enable Express `app.set('trust proxy', 1)` for Render deployment compatibility.
- **Verification**: Test 6 rapid invalid logins to confirm `429 Too Many Requests` status response.

#### **Step 2.3: Password Reset Flow (Tokens & Endpoint)**
- **Goal**: Allow users to reset forgotten passwords securely.
- **Tasks**:
  1. Add `password_resets` table in DB (`email`, `token`, `expires_at`).
  2. Implement `POST /api/auth/forgot-password` (generates 64-char crypto token).
  3. Implement `POST /api/auth/reset-password` (validates token and updates password).
  4. Create `ForgotPasswordModal.jsx` component in UI.
- **Verification**: Request token, submit new password, login with new password.

---

### 🔹 Phase 3: Database & Maintenance Hardening

#### **Step 3.1: Automated Database Migration Framework**
- **Goal**: Version control DB schema changes for both SQLite and PostgreSQL.
- **Tasks**:
  1. Set up lightweight migration runner script in `Backend/migrations/`.
  2. Convert table initializations (`users`, `messages`, `conversations`, `friendships`) into ordered migration files (`001_init.sql`, `002_calls.sql`, etc.).
- **Verification**: Run `npm run db:migrate` on a clean DB.

#### **Step 3.2: Automated DB Backup Script**
- **Goal**: Backup database to prevent data loss.
- **Tasks**:
  1. Create `Backend/scripts/backup.js` CLI tool.
  2. Supports SQLite `.db` snapshot copy and PostgreSQL `pg_dump` export.
- **Verification**: Run `npm run db:backup` and verify timestamped sql file in `Backend/backups/`.

---

### 🔹 Phase 4: Advanced Real-Time Messaging & Features

#### **Step 4.1: Media & File Attachments in Chat**
- **Goal**: Allow users to upload and share images and document files in chat.
- **Tasks**:
  1. Add Multer file upload middleware to `Backend/middleware/uploadMiddleware.js` (10MB limit, image/pdf/doc types).
  2. Create `POST /api/messages/upload` endpoint.
  3. Update `ChatWindow.jsx` with file attachment button and image preview modal.
  4. Render image/file bubbles in chat thread.
- **Verification**: Upload an image, verify preview renders, verify recipient sees image in real-time.

#### **Step 4.2: Global Message Search Across Threads**
- **Goal**: Search message history across all conversations.
- **Tasks**:
  1. Add `GET /api/messages/search?q=query` endpoint in `messageController.js`.
  2. Create Global Search input overlay in `ChatSidebar.jsx`.
  3. Highlight matching query text and jump to target conversation on click.
- **Verification**: Type keyword, verify matching messages from multiple chats appear in search results.

---

### 🔹 Phase 5: Quality Assurance, Unit Testing & Logging

#### **Step 5.1: Structured Logging System (Winston/Pino)**
- **Goal**: Replace `console.log` with production log levels and JSON formatting.
- **Tasks**:
  1. Install `winston` in `Backend`.
  2. Create `Backend/utils/logger.js` logging to `logs/combined.log` and `logs/error.log`.
  3. Replace raw `console.log` across controllers with `logger.info()` and `logger.error()`.
- **Verification**: Verify error logs write to `logs/error.log` in structured JSON format.

#### **Step 5.2: Frontend Unit & Component Testing Suite (Vitest + RTL)**
- **Goal**: Prevent UI regressions.
- **Tasks**:
  1. Configure Vitest and `@testing-library/react` in `/UI`.
  2. Write unit tests for `AuthPage.test.jsx`, `NavDock.test.jsx`, `ChatWindow.test.jsx`, and `CallsPage.test.jsx`.
- **Verification**: `npm test` in `/UI` passes all test suites.

#### **Step 5.3: End-to-End (E2E) Testing Suite (Playwright)**
- **Goal**: Automated verification of end-to-end user workflows.
- **Tasks**:
  1. Configure Playwright in project root.
  2. Write E2E test scripts for registration → friend request → messaging → video call workflow.
- **Verification**: `npx playwright test` passes cleanly in headless mode.

---

### 🔹 Phase 6: OpenAPI Documentation & Production Handover

#### **Step 6.1: OpenAPI / Swagger API Specification**
- **Goal**: Provide complete API & Socket.IO documentation.
- **Tasks**:
  1. Create `Backend/docs/swagger.json` covering all REST endpoints and schemas.
  2. Mount `swagger-ui-express` on `/api/docs`.
- **Verification**: Open `http://localhost:10000/api/docs` in browser to view interactive API documentation.

#### **Step 6.2: Architecture Diagram & Final Handover Sign-Off**
- **Goal**: Complete README and production handover requirements.
- **Tasks**:
  1. Add Mermaid ERD diagram and System Architecture diagram to `README.md`.
  2. Fill out all sign-off sections in `UI/checklist.md`.
- **Verification**: Confirm `README.md` renders diagrams clearly.
