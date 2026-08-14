# ChatApp Pro — Complete Production Professionalization & Enhancement Prompt

## ROLE

Act as a senior full-stack engineer, security engineer, backend architect, frontend architect, and QA engineer.

You are working on an existing full-stack real-time messaging application called **ChatApp Pro**.

The application is already functional. Your job is to **professionalize, harden, optimize, and extend the existing application without redesigning the UI**.

Do NOT treat this as a greenfield project.

You must first inspect the existing codebase, understand the architecture, identify what is already implemented, and then modify the application incrementally.

---

# 1. EXISTING TECHNOLOGY STACK

## Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* React Router DOM
* React Context API
* Socket.IO Client
* Axios/fetch or the existing API communication mechanism

## Backend

* Node.js
* Express
* SQLite
* Socket.IO
* JWT
* bcrypt

## Existing authentication

Already implemented:

* Registration
* Login
* Logout
* bcrypt password hashing
* JWT authentication
* Protected routes
* Persistent login
* `localStorage` token storage
* API authorization middleware
* User profile information
* Full name
* Email
* Profile picture
* Status/Bio

## Existing real-time functionality

Already implemented:

* Private 1-to-1 messaging
* Socket.IO
* Online/offline status
* Typing indicators
* Read receipts
* Blue ticks
* Message reactions
* Message editing
* Real-time sidebar updates
* Unread message counts
* Audio notification chime

## Existing UI

The current UI is already designed and functional.

### CRITICAL REQUIREMENT

**DO NOT REDESIGN THE UI.**

Preserve:

* Existing layout
* Existing page structure
* Existing sidebar
* Existing chat window
* Existing colors
* Existing typography
* Existing spacing
* Existing component hierarchy
* Existing navigation
* Existing responsive behavior
* Existing icons
* Existing visual identity
* Existing buttons
* Existing cards
* Existing modals

Do not replace the current design with a new design system.

Do not introduce a completely different visual style.

Do not move major elements around.

Do not change the existing user experience unnecessarily.

The goal is:

> **Same UI + significantly better engineering, security, reliability, functionality, animations, performance, and production readiness.**

Only make visual changes when they are absolutely necessary for a new feature.

---

# 2. FIRST TASK — AUDIT THE EXISTING APPLICATION

Before modifying anything, inspect the entire repository.

Understand:

### Frontend

* `src/`
* Components
* Pages
* Contexts
* Hooks
* Services
* API utilities
* Socket.IO implementation
* Authentication implementation
* Protected routes
* Local storage usage
* Message state management
* User state management
* Chat state management
* Error handling
* Loading states
* Existing animations

### Backend

Inspect:

* Server entry point
* Express middleware
* Routes
* Controllers
* Services
* SQLite initialization
* Database schema
* SQL queries
* Authentication middleware
* JWT generation
* JWT validation
* Socket.IO initialization
* Socket authentication
* Room management
* Message handling
* User handling
* Error handling
* CORS
* Environment variables

### Database

Inspect:

* Existing tables
* Primary keys
* Foreign keys
* Indexes
* Constraints
* Message schema
* User schema
* Conversation/chat schema
* Reactions
* Read receipts
* Any other tables

### Important

Do not recreate existing functionality unnecessarily.

Do not duplicate routes.

Do not create duplicate database tables.

Do not create duplicate authentication systems.

Do not replace working functionality without a clear reason.

First understand what already exists.

---

# 3. CREATE A SAFE DEVELOPMENT STRATEGY

Before making major changes:

1. Identify the existing architecture.
2. Identify existing functionality.
3. Identify missing functionality.
4. Identify security vulnerabilities.
5. Identify database changes required.
6. Identify frontend changes required.
7. Identify backend changes required.
8. Identify Socket.IO changes required.
9. Identify deployment requirements.
10. Create a logical implementation order.

Do not make dozens of unrelated changes simultaneously.

Work in logical modules.

After each major module:

* Verify imports
* Verify routes
* Verify database queries
* Verify authentication
* Verify Socket.IO
* Verify frontend compilation
* Verify backend startup
* Verify existing functionality

Do not leave the application in a broken intermediate state.

---

# 4. AUTHENTICATION PROFESSIONALIZATION

The current authentication system uses:

* bcrypt
* JWT
* localStorage
* protected routes

Keep JWT authentication, but improve its security and architecture.

## Implement:

### Registration

Validate:

* Full name
* Email
* Password
* Password confirmation

Rules:

* Email must be valid.
* Email must be normalized.
* Password must meet minimum strength requirements.
* Duplicate emails must be rejected cleanly.
* Password must never be stored as plaintext.
* Password confirmation must never be stored.

Return safe user information only.

Never return:

* Password hash
* JWT secret
* Internal security fields

---

# 5. JWT SECURITY IMPROVEMENT

Review the current JWT implementation.

Implement:

* Short-lived access tokens
* Proper token expiration
* Secure token validation
* Token issuer where appropriate
* Token audience where appropriate
* Strong secret from environment variables
* Proper JWT error handling

Do not hard-code secrets.

Never commit secrets into Git.

Create/update:

`.env.example`

with placeholders only.

---

# 6. IMPROVE TOKEN STORAGE

The current application stores JWT in `localStorage`.

Evaluate this architecture carefully.

Where practical, migrate toward:

### Access token

Short-lived access token kept in application memory.

### Refresh token

Secure:

* HTTP-only
* Secure in production
* SameSite appropriately configured
* Expiring refresh token

The refresh token must not be readable by JavaScript.

Implement token refresh where appropriate.

However:

**Do not break Socket.IO authentication.**

The Socket.IO authentication flow must be redesigned appropriately so that authenticated sockets continue to work securely.

If a complete refresh-token migration would create unnecessary instability in the current application, implement the safest incremental architecture possible and document the decision.

---

# 7. LOGOUT

Logout must:

* Clear frontend authentication state
* Invalidate/rotate refresh token if implemented
* Disconnect the Socket.IO connection
* Clear user-specific state
* Clear cached chat state
* Prevent access to protected pages
* Prevent authenticated API requests after logout

Logout must work correctly even if the socket is already disconnected.

---

# 8. FORGOT PASSWORD

Implement:

### Forgot Password

User enters email.

The system should:

1. Validate email.
2. Avoid revealing whether an account exists.
3. Generate a secure random reset token.
4. Store only a hashed representation of the reset token.
5. Add expiration.
6. Allow one-time use.
7. Invalidate after successful password reset.

For development, if an actual email provider is not configured, provide a safe development mechanism without exposing reset tokens in production logs.

Prepare the architecture so an email provider can easily be added later.

---

# 9. RESET PASSWORD

Create secure password reset functionality.

Requirements:

* Token validation
* Token expiration
* One-time usage
* Password strength validation
* bcrypt hashing
* Existing reset tokens invalidated after success
* Existing sessions optionally invalidated after password reset
* Clear success/error handling

---

# 10. CHANGE PASSWORD

Add authenticated change-password functionality.

Require:

* Current password
* New password
* Confirm new password

Validate:

* Current password is correct
* New password is strong
* New password is different where appropriate
* Confirmation matches

After changing the password:

* Invalidate appropriate sessions/tokens
* Require reauthentication if appropriate
* Maintain security of the current account

---

# 11. EMAIL VERIFICATION ARCHITECTURE

Prepare email verification.

Add database support for:

* `email_verified`
* Verification token hash
* Verification expiration

Implement:

* Generate verification token
* Verify token
* Expire token
* Prevent reuse
* Resend verification

Do not make the entire application unusable if email configuration is not available during development.

---

# 12. INPUT VALIDATION

Introduce **Zod** or another strong schema-validation library.

Use validation consistently.

Validate:

### Authentication

* Register
* Login
* Forgot password
* Reset password
* Change password

### User

* Name
* Email
* Bio/status

### Messaging

* Message text
* Message IDs
* Conversation IDs
* Reaction values

### API parameters

* IDs
* Pagination
* Search queries
* Sorting
* Filtering

### Socket events

Validate Socket.IO payloads exactly like REST API payloads.

Never trust frontend validation.

Backend validation is mandatory.

---

# 13. SECURITY HARDENING

Implement production-level security.

Add:

### Helmet

Use Express Helmet with sensible configuration.

### Rate limiting

Add rate limits especially for:

* Login
* Registration
* Forgot password
* Reset password
* Message sending
* User search
* API requests

Do not make normal chat usage frustrating.

Use stricter limits for authentication endpoints.

### CORS

Make CORS production-safe.

Do not use:

```text
*
```

when credentials are involved.

Use environment-based allowed origins.

Example:

```text
CLIENT_URL
```

Support separate development and production origins.

### Request size limits

Configure Express request body limits.

### Security headers

Use Helmet and appropriate HTTP security headers.

### Error handling

Never expose:

* Stack traces
* Database errors
* SQL statements
* JWT secrets
* Internal paths
* Sensitive implementation details

to normal production users.

---

# 14. SQL INJECTION PROTECTION

Review every SQLite query.

Use parameterized queries.

Never concatenate user input into SQL statements.

Audit:

* Login
* Registration
* Search
* Messages
* Conversations
* Reactions
* User profiles
* Pagination
* Filtering

---

# 15. DATABASE PROFESSIONALIZATION

Review the SQLite database architecture.

Ensure appropriate:

* Primary keys
* Foreign keys
* Unique constraints
* NOT NULL constraints
* Indexes
* Timestamps
* Cascading behavior where appropriate

Enable foreign-key enforcement.

Review all tables for consistency.

Do not destroy existing user data.

Do not drop tables casually.

If schema changes are required, create safe migrations.

---

# 16. DATABASE MIGRATION SYSTEM

Introduce a simple migration mechanism if one does not already exist.

Example:

```text
migrations/
    001_initial_schema.sql
    002_auth_improvements.sql
    003_password_reset.sql
    004_indexes.sql
```

Migrations should be:

* Repeatable safely
* Ordered
* Trackable
* Versioned

Never require manually deleting the database during development.

---

# 17. DATABASE INDEXING

Analyze common queries and add indexes where beneficial.

Likely candidates include:

* User email
* User ID
* Conversation participants
* Message conversation ID
* Message timestamp
* Unread messages
* Message sender
* Message receiver
* Reset tokens
* Verification tokens

Do not add unnecessary indexes blindly.

---

# 18. USER PROFILE IMPROVEMENTS

Keep the current UI.

Improve the underlying functionality.

Support:

* Update full name
* Update bio/status
* Update profile image
* Change password
* Account information
* Email verification status

Ensure users can only modify their own profile.

Never allow a client to submit another user's ID and modify that user's account.

The backend must determine the authenticated user from the authentication context.

---

# 19. PROFILE IMAGE SECURITY

The current profile images use DiceBear.

Preserve the current functionality.

If image upload functionality is later introduced:

Validate:

* File type
* MIME type
* File size
* Extension
* Image dimensions

Never trust only the file extension.

Prevent malicious file uploads.

Do not store arbitrary executable files.

---

# 20. USER SEARCH

Professionalize user search.

Implement:

* Search by name/email as appropriate
* Pagination
* Minimum search length
* Rate limiting
* Input sanitization
* Case-insensitive matching
* Proper empty states

Do not expose unnecessary private information.

Do not allow unrestricted database enumeration.

---

# 21. CHAT ARCHITECTURE

Preserve the current 1-to-1 messaging architecture.

Ensure:

* Only authorized users can access a conversation.
* Users cannot subscribe to arbitrary private rooms.
* Users cannot read another user's messages.
* Conversation membership is verified server-side.

Never trust:

```text
conversationId
senderId
receiverId
```

from the client without verification.

The authenticated user identity must come from the server-side authentication context.

---

# 22. MESSAGE SECURITY

Every message must be validated.

Handle:

* Empty messages
* Whitespace-only messages
* Excessively long messages
* Invalid message IDs
* Unauthorized edits
* Unauthorized deletions
* Invalid reactions

Limit message length to a sensible value.

Prevent abuse through rate limiting.

---

# 23. MESSAGE EDITING

Existing editing functionality must be preserved.

Ensure:

* Only the message owner can edit a message.
* Server verifies ownership.
* Edited timestamp is stored.
* Client receives real-time update.
* Other participant sees the edit immediately.

Never trust the frontend's `senderId`.

---

# 24. MESSAGE DELETION

If deletion does not already exist, consider implementing it professionally.

Support:

* Delete for me
* Delete for everyone

if compatible with the existing product direction.

Ensure permissions are enforced server-side.

Do not physically remove important records if the application needs auditability.

Use soft deletion where appropriate.

---

# 25. MESSAGE REACTIONS

Preserve existing emoji reactions.

Improve:

* Validation
* Authorization
* Duplicate reaction handling
* Removal
* Real-time synchronization
* Database consistency

A user should not be able to manipulate reactions on messages they are not authorized to access.

---

# 26. READ RECEIPTS

Preserve:

* Sent
* Delivered if supported
* Read
* Blue ticks

Ensure read status is persisted.

Socket.IO should provide instant updates.

REST/database should provide persistence.

If a user reconnects, the correct read state must be restored.

---

# 27. TYPING INDICATORS

Preserve the current typing indicator.

Improve it so:

* It is socket-based.
* It is not persisted unnecessarily.
* It automatically times out.
* It does not generate excessive events.

Use throttling/debouncing.

---

# 28. ONLINE/OFFLINE STATUS

Preserve current online/offline functionality.

Improve reliability around:

* Multiple tabs
* Browser refresh
* Network interruption
* Socket reconnect
* Server restart
* Logout
* Duplicate socket connections

A user should not incorrectly remain online forever because of a disconnected socket.

---

# 29. SOCKET.IO SECURITY

This is extremely important.

Authenticate Socket.IO connections.

Do not allow unauthenticated users to connect to private messaging functionality.

Validate every socket event.

Validate:

* User identity
* Room membership
* Message ownership
* Conversation membership
* Payload structure

Never trust socket payloads simply because they originated from an authenticated socket.

Implement proper disconnect handling.

Implement reconnection handling.

Avoid duplicate event listeners.

---

# 30. SOCKET.IO EVENT ARCHITECTURE

Review existing events.

Create a consistent event naming convention.

For example:

```text
message:send
message:new
message:edit
message:deleted
message:read
message:reaction
typing:start
typing:stop
user:online
user:offline
```

Do not rename existing events unnecessarily if doing so would break the current frontend.

If renaming is required, update all consumers consistently.

---

# 31. SOCKET + REST ARCHITECTURE

Maintain the current dual architecture:

### REST API

Responsible for:

* Persistence
* Authentication
* Fetching historical messages
* User data
* Conversations
* Profile changes
* Password operations

### Socket.IO

Responsible for:

* Real-time message delivery
* Typing indicators
* Read receipts
* Reactions
* Online status
* Real-time updates

Do not use Socket.IO as a replacement for database persistence.

Do not rely exclusively on socket events for important data.

---

# 32. RECONNECTION & OFFLINE RECOVERY

Implement robust socket reconnection.

When the connection is restored:

1. Authenticate again if necessary.
2. Rejoin authorized rooms.
3. Restore online state.
4. Synchronize unread messages.
5. Synchronize read receipts.
6. Recover any missed state from REST APIs.

The application should recover gracefully after:

* Wi-Fi disconnect
* Server restart
* Laptop sleep
* Browser tab suspension
* Network changes

---

# 33. API ARCHITECTURE

Review all API endpoints.

Use consistent structure:

```text
/api/auth/*
/api/users/*
/api/chats/*
/api/messages/*
```

Do not create inconsistent endpoint patterns.

Use appropriate HTTP status codes.

Examples:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
```

---

# 34. GLOBAL ERROR HANDLING

Create a centralized Express error-handling mechanism.

Errors should have a consistent structure.

Example:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Do not expose stack traces in production.

Frontend should handle API errors consistently.

---

# 35. FRONTEND API LAYER

Centralize API communication.

Avoid scattered:

```javascript
fetch(...)
```

or Axios configurations throughout components where possible.

Create a reusable API client.

Handle:

* Base URL
* Authentication
* Token refresh
* Error handling
* Timeouts
* JSON parsing
* Network failures

Do not duplicate authentication logic in every component.

---

# 36. FRONTEND AUTH STATE

Improve Context API architecture without unnecessarily replacing it.

Create clear separation between:

* Auth state
* User state
* Chat state
* Socket state

Ensure:

* Login updates auth state
* Logout clears state
* Token expiration is handled
* Socket disconnects on logout
* Protected routes work correctly
* Refresh restores valid session
* Invalid sessions are handled gracefully

---

# 37. PROTECTED ROUTES

Ensure all protected pages require authentication.

Prevent:

* Unauthenticated access
* Flashing private content before authentication resolves
* Redirect loops
* Broken navigation after logout

Handle authentication loading states properly.

---

# 38. LOADING STATES

Every asynchronous operation should have an appropriate loading state.

Preserve the current UI.

Improve implementation for:

* Login
* Registration
* Loading chats
* Loading messages
* Sending messages
* Editing messages
* Reactions
* Search
* Profile updates
* Password changes
* Logout
* Socket connection

Avoid unnecessary full-page loading spinners.

Prefer the existing UI's visual language.

Use skeletons/spinners where already appropriate.

---

# 39. ERROR STATES

Create polished error handling for:

* API unavailable
* Network disconnected
* Socket disconnected
* Authentication expired
* Invalid credentials
* Validation errors
* Message send failure
* Message edit failure
* Search failure
* Profile update failure
* Server error

Errors must be understandable to normal users.

Do not display raw technical errors.

---

# 40. TOAST NOTIFICATIONS

If a toast library is not already present, introduce a lightweight professional solution.

Use it for:

* Login success/failure
* Registration
* Password changes
* Profile updates
* Message failures
* Connection problems
* Successful operations

Do not spam users with unnecessary notifications.

---

# 41. ANIMATIONS

Do NOT redesign the UI.

The application already uses Tailwind micro-interactions.

Preserve those.

Add subtle professional animations where appropriate.

Possible additions:

* Page transition
* Modal enter/exit
* Chat message entrance
* Sidebar item transitions
* Unread badge transition
* Online indicator transition
* Typing indicator animation
* Reaction animation
* Toast animation
* Button loading transition
* Connection status transition

Animations should be:

* Fast
* Subtle
* Professional
* Functional

Avoid excessive animations.

Do not make every element bounce or scale.

---

# 42. REDUCED MOTION

Respect:

```text
prefers-reduced-motion
```

Users who have reduced-motion enabled should receive minimal animation.

---

# 43. MESSAGE UX MICRO-INTERACTIONS

Without changing the existing UI:

Add subtle interactions such as:

* Message appearing smoothly
* Reaction feedback
* Send button loading state
* Message edit transition
* Read receipt transition
* Typing indicator transition
* Connection indicator transition

Do not change the fundamental design.

---

# 44. AUDIO NOTIFICATIONS

The current application already has an in-browser audio chime.

Preserve it.

Improve it so that:

* It does not play unnecessarily.
* It does not play for the sender's own message.
* It respects browser autoplay restrictions.
* It can be disabled later through notification settings.
* It does not create multiple audio instances.

---

# 45. NOTIFICATION SETTINGS ARCHITECTURE

Add backend/database support for future notification preferences.

Potential settings:

```text
message notifications
sound notifications
typing notifications
read receipt visibility
online status visibility
```

Do not redesign the existing UI.

Only add settings UI where required and integrate it into the existing visual style.

---

# 46. ACCOUNT SETTINGS

Create a professional settings architecture.

Potential sections:

### Account

* Name
* Email
* Profile picture
* Bio

### Security

* Change password
* Active sessions
* Logout from all devices

### Notifications

* Message sounds
* Notifications

### Privacy

* Online status
* Read receipts

Keep the existing UI style.

---

# 47. LOGOUT FROM ALL DEVICES

Implement a session architecture capable of revoking sessions.

Add a sessions table if necessary.

Track:

* Session ID
* User ID
* Created time
* Last activity
* Expiration
* Revocation status

Allow:

```text
Logout current session
Logout all sessions
```

This should also disconnect/revoke relevant Socket.IO sessions.

---

# 48. ADMIN ARCHITECTURE

The current application has no admin functionality.

Introduce a secure foundation for future administration.

Add a role concept:

```text
user
admin
```

Do not expose admin functionality to normal users.

Backend must enforce authorization.

Never rely on hiding an admin button in the frontend.

---

# 49. ADMIN FEATURES

Create an admin area only if compatible with the current project scope.

Possible features:

### Dashboard

* Total users
* Active users
* Total messages
* Messages today
* Online users

### User management

* Search users
* View users
* Disable user
* Enable user
* Delete user if appropriate

### Moderation

* View reported content
* Review reports
* Remove content
* Suspend users

### Audit logs

Track sensitive admin actions.

Keep the admin UI consistent with the existing application style rather than introducing an unrelated design.

---

# 50. REPORTING SYSTEM

Consider adding message/user reporting.

Users should be able to report:

* Message
* User

Store:

```text
reporter
target
reason
description
status
created_at
resolved_at
```

Do not expose reports to normal users.

---

# 51. AUDIT LOG

Create an audit mechanism for important security actions.

Examples:

* Login
* Logout
* Password change
* Password reset
* Account disable
* Admin actions
* Session revocation

Never store passwords or secrets in audit logs.

---

# 52. PAGINATION

Do not load unlimited data.

Implement pagination for:

* Messages
* User search
* Conversations where appropriate
* Admin users
* Reports

For messages, prefer cursor-based pagination if practical.

The chat should initially load recent messages and allow older messages to load progressively.

Do not break the existing chat scrolling behavior.

---

# 53. CHAT PERFORMANCE

Optimize rendering.

Avoid unnecessary re-rendering of:

* Entire sidebar
* Entire message list
* Every message when one message changes

Use:

* Memoization where appropriate
* Stable callbacks
* Proper keys
* Efficient Context usage
* Selective state updates

Do not prematurely optimize everything.

Measure before making complex changes.

---

# 54. MESSAGE LIST OPTIMIZATION

If message history becomes large, consider virtualization.

Do not introduce virtualization if it breaks:

* Scroll behavior
* Message grouping
* Reactions
* Editing
* Read receipts
* Typing indicators

Only use it when beneficial.

---

# 55. FRONTEND CODE QUALITY

Refactor where necessary.

Avoid:

* Huge components
* Duplicate API logic
* Duplicate socket logic
* Magic strings
* Hardcoded URLs
* Hardcoded secrets
* Deeply nested conditionals
* Unnecessary state
* Memory leaks
* Unremoved event listeners

Use reusable:

* Hooks
* Services
* Utilities
* Components
* Constants

Do not over-engineer simple features.

---

# 56. SOCKET MEMORY LEAK PREVENTION

Audit all:

```javascript
socket.on(...)
```

listeners.

Every subscription should have appropriate cleanup.

Prevent:

* Duplicate listeners
* Duplicate messages
* Multiple typing indicators
* Memory leaks after route changes
* Events firing after logout

---

# 57. FRONTEND ROUTING

Review React Router configuration.

Ensure:

* Protected routes
* Public routes
* Authentication redirects
* Unknown route handling
* Proper logout navigation
* Refresh behavior

Do not unnecessarily change the current route structure.

---

# 58. ENVIRONMENT CONFIGURATION

Create clear environment variables.

Frontend:

```text
VITE_API_URL=
VITE_SOCKET_URL=
```

Backend:

```text
PORT=
CLIENT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
REFRESH_TOKEN_SECRET=
DATABASE_PATH=
NODE_ENV=
```

Only include variables actually required by the implementation.

Create:

```text
.env.example
```

Never commit real secrets.

---

# 59. HEALTH CHECK

Add:

```text
GET /api/health
```

Response should indicate:

* API is running
* Environment
* Timestamp
* Database connectivity if appropriate

Example:

```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

Do not expose sensitive infrastructure details.

---

# 60. GRACEFUL SERVER SHUTDOWN

Implement graceful shutdown.

Handle:

* SIGTERM
* SIGINT

Close:

* Socket.IO
* HTTP server
* SQLite connection

Prevent corrupted/incomplete operations where possible.

---

# 61. SQLITE PRODUCTION CONSIDERATIONS

SQLite is acceptable for this project.

Do not automatically replace it with PostgreSQL.

However, review:

* WAL mode
* Foreign keys
* Busy timeout
* Transactions
* Indexes
* Connection lifecycle
* Concurrent writes

Ensure database writes are safe.

For deployment platforms with ephemeral filesystems, clearly document that SQLite requires persistent disk/storage if data must survive deployments/restarts.

Do not silently assume ephemeral filesystem storage is permanent.

---

# 62. TRANSACTIONS

Use transactions where multiple database operations must succeed together.

Examples:

* Creating conversation + participants
* Message + related state
* Password reset completion
* Account deletion
* Admin moderation operations

If one operation fails, roll back appropriately.

---

# 63. API RATE LIMITING STRATEGY

Use different limits for different endpoints.

Strict:

* Login
* Register
* Forgot password
* Reset password

Moderate:

* User search
* Message creation

Normal:

* Fetch messages
* Fetch profile
* Conversations

Do not rate-limit Socket.IO typing events excessively in a way that breaks functionality.

---

# 64. SECURITY AGAINST USER ENUMERATION

Login and forgot-password flows should not reveal whether an email exists.

Avoid responses like:

```text
This email is registered.
```

or:

```text
No account found.
```

where that could enable account enumeration.

Use generic responses where appropriate.

---

# 65. XSS PROTECTION

Review all user-generated content.

Potentially untrusted data includes:

* Name
* Bio
* Status
* Message
* Search query
* Reaction metadata

Do not render user-generated HTML directly.

React's default escaping should be preserved.

Do not use `dangerouslySetInnerHTML` unless absolutely necessary and properly sanitized.

---

# 66. CSRF CONSIDERATIONS

If HTTP-only cookies are introduced for refresh/session authentication, implement appropriate CSRF protections.

Use appropriate:

* SameSite configuration
* CSRF token strategy if required
* Origin checking where appropriate

Do not introduce cookies without considering CSRF.

---

# 67. SECURITY LOGGING

Create useful server-side logs.

Log:

* Authentication failures
* Unexpected server errors
* Socket authentication failures
* Rate-limit events
* Security-relevant actions

Do not log:

* Passwords
* JWT secrets
* Refresh tokens
* Full private message contents unnecessarily

---

# 68. TESTING

Introduce a proper testing setup.

At minimum:

### Authentication tests

* Register
* Duplicate registration
* Login
* Invalid password
* Protected endpoint
* Logout
* Token expiration
* Password reset
* Change password

### Authorization tests

* User accessing own data
* User accessing another user's data
* Unauthorized message editing
* Unauthorized message deletion
* Unauthorized conversation access

### Message tests

* Send
* Edit
* Read
* React
* Invalid message

### Socket tests

* Authenticated connection
* Unauthorized connection
* Message delivery
* Typing
* Read receipts
* Reconnection

---

# 69. FRONTEND TESTING

Add component tests for important components.

Test:

* Login form
* Registration form
* Protected route
* Chat screen
* Message composer
* Message editing
* Reactions
* Sidebar
* User search
* Profile/settings

Do not test implementation details unnecessarily.

Test actual user behavior.

---

# 70. END-TO-END TESTING

If practical, add Playwright or Cypress.

Critical flow:

```text
Open app
↓
Register
↓
Login
↓
Search user
↓
Open chat
↓
Send message
↓
Second user receives message
↓
Typing indicator appears
↓
Message is read
↓
Reaction is added
↓
Message is edited
↓
Logout
```

Also test:

```text
Invalid login
Expired session
Socket reconnect
Protected route
Password reset
```

---

# 71. ACCESSIBILITY

Do not redesign the UI.

Improve accessibility internally.

Ensure:

* Buttons have accessible names
* Inputs have labels
* Modals have appropriate focus behavior
* Keyboard navigation works
* Escape closes appropriate modals
* Focus states remain visible
* Screen readers can understand important actions
* Images have appropriate alt text
* Loading states have accessible descriptions
* Color is not the only way information is communicated

---

# 72. RESPONSIVE BEHAVIOR

Do not redesign responsive layouts.

Audit the existing UI at:

* Desktop
* Laptop
* Tablet
* Mobile

Fix only genuine functional/responsive bugs.

Do not change the design language.

---

# 73. NETWORK FAILURE HANDLING

The application must gracefully handle:

* API unavailable
* Socket unavailable
* Internet disconnected
* Server restart
* Request timeout

Show an appropriate existing-style notification/status.

Do not leave the application silently broken.

---

# 74. OFFLINE-AWARE BEHAVIOR

Detect:

```javascript
navigator.onLine
```

where useful.

When offline:

* Indicate connection status.
* Prevent impossible operations where appropriate.
* Preserve typed message content where possible.
* Retry/recover when connection returns.

Do not claim a message was delivered if it was not persisted.

---

# 75. MESSAGE SEND RELIABILITY

Improve message sending so the UI does not incorrectly display a successful message when the server fails.

If appropriate, use temporary message states:

```text
sending
sent
failed
```

Do not introduce complicated optimistic behavior if it causes duplication.

The database must remain the source of truth for persisted messages.

---

# 76. DUPLICATE MESSAGE PREVENTION

Socket + REST architecture can sometimes result in duplicate messages.

Design the system so the same message is not appended multiple times.

Use a unique message ID.

Frontend should reconcile incoming socket events with existing messages.

---

# 77. SECURITY OF MESSAGE IDS

Review message ID generation.

Ensure IDs are not easily exploitable for unauthorized data access.

Even if IDs are predictable, server-side authorization must always be enforced.

---

# 78. API DOCUMENTATION

Create documentation for the backend.

Document:

* Authentication endpoints
* User endpoints
* Chat endpoints
* Message endpoints
* Socket events
* Request bodies
* Responses
* Error responses
* Authentication requirements

A simple:

```text
API.md
```

is acceptable.

---

# 79. PROJECT DOCUMENTATION

Improve `README.md`.

Include:

### Project overview

### Features

### Tech stack

### Architecture

### Installation

### Environment variables

### Database setup

### Development

### Production build

### Deployment

### Authentication architecture

### Socket.IO architecture

### Security

### Testing

### Troubleshooting

### Future improvements

Make it professional enough for a GitHub portfolio.

---

# 80. ARCHITECTURE DOCUMENTATION

Add an architecture explanation.

Explain:

```text
React
   ↓
REST API
   ↓
Express
   ↓
SQLite

React
   ↕
Socket.IO
   ↕
Node/Express
```

Explain how:

* Authentication works
* Messages are persisted
* Real-time events work
* Rooms work
* Read receipts work
* Reconnection works

---

# 81. PERFORMANCE

Optimize production build.

Review:

* Bundle size
* Lazy loading
* Route splitting
* Image loading
* API calls
* Duplicate requests
* Socket listeners
* React rendering
* Database queries

Use React lazy loading for large routes where appropriate.

Do not add unnecessary libraries.

---

# 82. DEPENDENCY MANAGEMENT

Review existing dependencies.

Remove:

* Unused packages
* Duplicate packages
* Obsolete packages

Do not upgrade every dependency blindly.

Only upgrade dependencies when:

* Necessary
* Security-related
* Compatible with the current application

After dependency changes, verify the entire application.

---

# 83. CODE QUALITY

Ensure:

* Consistent naming
* Consistent error handling
* Reusable functions
* Clear folder structure
* No duplicated business logic
* No dead code
* No commented-out abandoned implementations
* No console debugging statements in production paths

Use comments only when they explain non-obvious logic.

---

# 84. SECURITY REVIEW

After implementation, perform a security audit.

Specifically look for:

* Broken authorization
* IDOR vulnerabilities
* JWT vulnerabilities
* Token leakage
* XSS
* SQL injection
* CORS misconfiguration
* CSRF risks
* Rate-limit bypass
* Socket authorization bypass
* Sensitive data exposure
* Password reset vulnerabilities
* User enumeration
* File upload vulnerabilities
* Privilege escalation

Fix all discovered issues.

---

# 85. REGRESSION TEST

The following existing functionality MUST continue working:

### Authentication

* Register
* Login
* Logout
* Persistent authentication

### User

* Search
* Profile
* Avatar
* Status/Bio

### Messaging

* Send messages
* Receive messages
* Message history
* Message editing
* Reactions

### Real-time

* Online/offline
* Typing
* Read receipts
* Socket reconnection
* Audio notification

### Navigation

* Protected routes
* Public routes
* Logout redirects

Do not consider the work complete if these are broken.

---

# 86. UI PRESERVATION RULE

This is one of the highest-priority requirements.

Before modifying any frontend component, determine whether the change actually requires a visual modification.

If it does not, modify only the logic.

Do not:

* Redesign components
* Replace Tailwind classes unnecessarily
* Change colors
* Change typography
* Change layout
* Replace icons
* Replace navigation
* Replace the sidebar
* Replace the chat window
* Replace the message bubbles
* Replace the overall theme

The existing UI should look substantially the same after the professionalization.

The improvement should primarily be visible through:

* Better behavior
* Better reliability
* Better animations
* Better loading states
* Better error handling
* Better security
* Better authentication
* Better responsiveness
* Better performance

---

# 87. DO NOT ADD UNNECESSARY TECHNOLOGIES

Do not introduce a large number of libraries simply because they are popular.

Before installing a dependency, ask:

1. Is it actually required?
2. Can the existing stack handle it?
3. Does it solve a meaningful problem?
4. Will it increase maintenance complexity?

Prefer the existing:

* React
* Vite
* Tailwind
* Context API
* Express
* SQLite
* Socket.IO

over replacing the architecture unnecessarily.

---

# 88. ERROR-RESILIENT DEVELOPMENT

If you encounter an existing bug while implementing a feature:

1. Understand the root cause.
2. Fix it properly.
3. Do not hide the error.
4. Do not add hacks merely to silence it.
5. Verify related functionality afterward.

Never solve an error by disabling security.

---

# 89. NO BREAKING CHANGES WITHOUT REASON

Preserve existing API contracts where possible.

If an API must change:

* Update backend
* Update frontend
* Update documentation
* Update tests

Do not leave old and new implementations conflicting with each other.

---

# 90. FINAL PRODUCTION CHECKLIST

Before declaring the project complete, verify:

## Authentication

* [ ] Registration works
* [ ] Login works
* [ ] Logout works
* [ ] Protected routes work
* [ ] Token expiration works
* [ ] Password reset works
* [ ] Password change works
* [ ] Email verification architecture exists
* [ ] Passwords are securely hashed

## Security

* [ ] Helmet enabled
* [ ] CORS restricted
* [ ] Rate limiting enabled
* [ ] Input validation enabled
* [ ] SQL injection protected
* [ ] XSS reviewed
* [ ] JWT security reviewed
* [ ] Socket authentication secured
* [ ] Authorization verified server-side
* [ ] Secrets removed from source code
* [ ] `.env.example` created

## Messaging

* [ ] Sending works
* [ ] Receiving works
* [ ] Editing works
* [ ] Reactions work
* [ ] Read receipts work
* [ ] Typing works
* [ ] Online/offline works
* [ ] Reconnection works
* [ ] Duplicate messages prevented
* [ ] Unauthorized access prevented

## Database

* [ ] Schema reviewed
* [ ] Migrations available
* [ ] Foreign keys enabled
* [ ] Indexes reviewed
* [ ] Transactions used where required
* [ ] SQLite production persistence documented

## Frontend

* [ ] UI preserved
* [ ] Existing design preserved
* [ ] Loading states improved
* [ ] Error states improved
* [ ] Animations improved
* [ ] Reduced-motion supported
* [ ] Memory leaks removed
* [ ] Socket listeners cleaned up
* [ ] Responsive behavior verified

## Testing

* [ ] Authentication tests
* [ ] Authorization tests
* [ ] API tests
* [ ] Socket tests
* [ ] Frontend tests
* [ ] E2E critical flow

## Production

* [ ] Health check
* [ ] Graceful shutdown
* [ ] Environment configuration
* [ ] Production error handling
* [ ] Production CORS
* [ ] Build succeeds
* [ ] Frontend build succeeds
* [ ] Backend starts successfully
* [ ] README updated
* [ ] API documentation updated

---

# 91. IMPLEMENTATION ORDER

Implement the work in this order.

## Phase 1 — Audit

Inspect the entire codebase.

Do not modify anything yet.

Produce a concise internal assessment of:

* Current architecture
* Existing features
* Missing features
* Security risks
* Database schema
* API structure
* Socket structure

Then begin implementation.

## Phase 2 — Foundation

Implement:

* Better environment configuration
* Centralized errors
* Validation
* Security middleware
* Rate limiting
* Helmet
* CORS hardening
* Database improvements
* Health check

## Phase 3 — Authentication

Implement:

* Secure token architecture
* Forgot password
* Reset password
* Change password
* Email verification architecture
* Session management
* Logout improvements

## Phase 4 — Messaging Security

Harden:

* REST authorization
* Socket authentication
* Room authorization
* Message authorization
* Reactions
* Read receipts
* Editing
* User access

## Phase 5 — Reliability

Implement:

* Socket reconnection
* Offline handling
* Duplicate prevention
* Message delivery reliability
* Loading states
* Error states
* State synchronization

## Phase 6 — UX Improvements

Without redesigning the UI:

* Improve micro-interactions
* Improve transitions
* Improve loading states
* Improve toast feedback
* Improve modal behavior
* Improve accessibility
* Improve reduced-motion behavior

## Phase 7 — Settings

Add:

* Account settings
* Security settings
* Notification preferences
* Privacy settings

while preserving the existing visual design.

## Phase 8 — Testing

Add:

* Unit tests
* Integration tests
* Socket tests
* E2E tests

## Phase 9 — Performance

Optimize:

* React rendering
* API requests
* Socket events
* Database queries
* Message history
* Bundle size

## Phase 10 — Documentation & Production

Finalize:

* README
* API documentation
* Architecture documentation
* `.env.example`
* Health check
* Deployment configuration
* Production checklist

---

# 92. IMPORTANT DEVELOPMENT RULE

Do not stop after creating files.

Actually integrate everything into the existing application.

For every feature:

```text
Database
    ↓
Backend model/query
    ↓
Service/controller
    ↓
API route
    ↓
Frontend API service
    ↓
React state/context
    ↓
Existing UI
```

For real-time features:

```text
Client
    ↓
Socket.IO
    ↓
Authentication
    ↓
Authorization
    ↓
Server event
    ↓
Database persistence where required
    ↓
Recipient socket
    ↓
React state update
```

Everything must be connected end-to-end.

---

# 93. IMPORTANT RULE ABOUT EXISTING CODE

Do not assume existing code is wrong merely because it does not follow your preferred architecture.

Preserve working code when it is safe.

Refactor only when there is a meaningful benefit.

If you discover an architectural problem, fix it incrementally.

Do not rewrite the entire application.

---

# 94. FINAL ACCEPTANCE CRITERIA

The finished ChatApp Pro should feel like a **real production-grade messaging application**, not a tutorial project.

It should demonstrate:

* Secure authentication
* Proper authorization
* Production-level API design
* Secure WebSocket architecture
* Persistent database storage
* Real-time communication
* Reliable reconnection
* Strong validation
* Rate limiting
* Secure headers
* Error handling
* Session management
* Password recovery
* Profile management
* Notification architecture
* Good accessibility
* Good performance
* Automated testing
* Professional documentation
* Clean code
* Production configuration

Most importantly:

### THE UI MUST REMAIN ESSENTIALLY THE SAME.

The purpose of this task is to transform:

> "A working React + Node chat application"

into:

> **"A secure, reliable, maintainable, production-quality full-stack real-time messaging platform."**

Do not sacrifice existing functionality merely to introduce new architecture.

Do not sacrifice security to preserve convenience.

Do not sacrifice the existing UI to introduce new functionality.

Implement carefully, incrementally, and verify every major change.
