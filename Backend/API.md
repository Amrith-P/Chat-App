# ChatApp Pro - API & Socket.IO Specification

This document provides a comprehensive technical reference for the ChatApp Pro REST APIs and real-time Socket.IO WebSocket protocol.

---

## Base URLs
- **Development REST Base**: `http://localhost:5050/api`
- **Development Socket Base**: `http://localhost:5050`
- **Production REST Base**: `https://chat-app-0yh9.onrender.com/api`

---

## Authentication & Headers

### Authorization Header
All protected REST endpoints require a short-lived Bearer Access Token (expires in 15 minutes):
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### HttpOnly Refresh Cookie
Authentication sets a 7-day HttpOnly cookie named `refreshToken`:
```http
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

---

## REST API Endpoints

### 1. Authentication (`/api/auth`)

#### `POST /api/auth/register`
Creates a new user account.
- **Rate Limit**: 15 requests / 15 minutes.
- **Request Body (Zod Validated)**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "avatar": "optional_avatar_url"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "message": "Registration successful",
    "token": "<short_lived_access_token>",
    "user": {
      "id": 1,
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "avatar": "...",
      "status": "Hey there! I am using ChatApp."
    }
  }
  ```

#### `POST /api/auth/login`
Authenticates credentials and establishes session.
- **Rate Limit**: 15 requests / 15 minutes.
- **Request Body (Zod Validated)**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Login successful",
    "token": "<short_lived_access_token>",
    "user": { ... }
  }
  ```

#### `POST /api/auth/refresh`
Rotates Access Token using the HttpOnly cookie.
- **Headers**: Requires `Cookie: refreshToken=...`
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Token refreshed successfully",
    "token": "<new_short_lived_access_token>",
    "user": { ... }
  }
  ```

#### `POST /api/auth/logout`
Clears session refresh cookie.
- **Response (`200 OK`)**:
  ```json
  { "message": "Logged out successfully" }
  ```

#### `POST /api/auth/revoke-all` *(Protected)*
Revokes all active sessions across all devices for the current user.
- **Response (`200 OK`)**:
  ```json
  { "message": "All active sessions have been revoked. Please log in again." }
  ```

#### `POST /api/auth/forgot-password`
Generates a secure password reset code.
- **Request Body**:
  ```json
  { "email": "jane@example.com" }
  ```

#### `POST /api/auth/reset-password`
Resets password using valid reset code.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "resetToken": "CODE123",
    "newPassword": "NewSecurePassword123!"
  }
  ```

---

### 2. User & Profile (`/api/users`)

#### `GET /api/users/search?q=query` *(Protected, Rate Limited)*
Searches registered contacts matching `q` excluding the current authenticated user.

#### `GET /api/users/:id` *(Protected)*
Fetches public user profile details.

#### `PUT /api/users/profile` *(Protected, Zod Validated)*
Updates display name, bio, or avatar.
- **Request Body**:
  ```json
  {
    "fullName": "Jane Smith",
    "status": "Busy coding 🚀"
  }
  ```

#### `PUT /api/users/change-password` *(Protected, Zod Validated)*
Changes account password.
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword456!"
  }
  ```

---

### 3. Chats & Messaging (`/api/chats`, `/api/messages`)

#### `GET /api/chats` *(Protected)*
Lists all direct 1-on-1 conversations for the logged-in user with recent message snippets and unread counters.

#### `POST /api/chats` *(Protected)*
Initiates or opens a 1-on-1 chat with `recipientId`.
- **Request Body**: `{ "recipientId": 2 }`

#### `GET /api/messages/:chatId` *(Protected)*
Retrieves message history for a conversation.

#### `POST /api/messages` *(Protected, Zod Validated)*
Persists a new message.
- **Request Body**:
  ```json
  {
    "chatId": 10,
    "content": "Hello there!",
    "replyToId": null
  }
  ```

---

## Socket.IO Real-Time Protocol

### Connection Handshake
Clients connect to Socket.IO passing the Access Token in `auth`:
```javascript
const socket = io('http://localhost:5050', {
  auth: { token: accessToken },
  transports: ['websocket', 'polling']
});
```

### Outbound Events (Client → Server)
- **`send_message`**: `{ conversationId, recipientId, content, replyToId }`
- **`typing`**: `{ conversationId, recipientId, isTyping }`
- **`mark_read`**: `{ messageId, conversationId, senderId }`
- **`add_reaction`**: `{ messageId, emoji, recipientId }`

### Inbound Events (Server → Client)
- **`receive_message`**: Emitted when a new message arrives in an active chat.
- **`user_online`**: `{ userId }` broadcast when a user connects.
- **`user_offline`**: `{ userId }` broadcast when a user disconnects.
- **`user_typing`**: `{ conversationId, userId, isTyping }` real-time typing indicator updates.

---

## Error Format Standard
All REST errors follow a standardized JSON structure:
```json
{
  "success": false,
  "message": "Human readable summary",
  "code": "ERROR_CODE",
  "errors": [
    { "field": "email", "message": "Invalid email address format" }
  ]
}
```
