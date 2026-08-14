Application Overview

ChatApp Pro is a full-stack real-time messaging application designed to provide a WhatsApp-like private messaging experience through a web browser.

The application consists of:

Frontend
React
Vite
JavaScript
Tailwind CSS
React Router DOM
Context API / React state
Socket.IO Client
Axios/fetch for REST API communication
Backend
Node.js
Express.js
Socket.IO
SQLite
JWT authentication
bcrypt password hashing
Communication architecture

The application uses two communication mechanisms simultaneously:

                     ChatApp Pro
                          │
              ┌───────────┴───────────┐
              │                       │
        REST API                 Socket.IO
              │                       │
       Persistent data          Real-time data
              │                       │
           SQLite              WebSocket connection
REST API is responsible for:
Registration
Login
Authentication
User search
User profile retrieval
Chat creation/retrieval
Message persistence
Historical message retrieval
Other database operations
Socket.IO is responsible for:
Instant messages
Typing indicators
Online/offline status
Read receipts
Emoji reactions
Real-time UI updates
2. Overall User Journey

The complete user journey is:

Application Opens
       ↓
Check Authentication Token
       ↓
 ┌─────┴─────┐
 │           │
Token       No Token
Valid        │
 │           ↓
 ↓         Login
Dashboard    ↓
 │         Authentication
 ↓           ↓
Search Users
       ↓
Select User
       ↓
Start / Open Chat
       ↓
Load Previous Messages
       ↓
Connect Socket
       ↓
Send / Receive Messages
       ↓
Typing / Read / Reactions
       ↓
Continue Conversations
       ↓
Logout
       ↓
Disconnect Socket
       ↓
Clear Authentication
       ↓
Login Page
3. Application Startup

When the user opens the application, React starts through Vite.

The frontend first determines whether the user already has an authenticated session.

Typically, the application checks:

localStorage
     ↓
JWT token

For example:

authToken = stored JWT

The application then decides:

If token exists

The user is considered potentially authenticated.

The application:

Retrieves the token.
Restores authentication state.
Loads the user information.
Establishes the Socket.IO connection.
Redirects the user to the main application/dashboard.
If token does not exist

The user is redirected to:

/login
4. Login Flow
Login Screen

The login page contains:

Application logo
Email input
Password input
Login button
Link to registration
Validation/error messages

Example:

┌──────────────────────────────────────┐
│              ChatApp                 │
│                                      │
│         Welcome Back                 │
│                                      │
│ Email                                │
│ ┌──────────────────────────────────┐ │
│ │ user@example.com                 │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Password                             │
│ ┌──────────────────────────────────┐ │
│ │ ••••••••••                       │ │
│ └──────────────────────────────────┘ │
│                                      │
│        [       Login       ]         │
│                                      │
│ Don't have an account? Register      │
└──────────────────────────────────────┘
5. Login Validation

When the user clicks Login, the frontend validates the form.

Typical checks:

Email
Required
Valid email format
Password
Required

If validation fails:

Login
 ↓
Validation
 ↓
Invalid
 ↓
Show error

The API request is not sent until the basic validation succeeds.

6. Login API Request

The frontend sends:

POST /api/auth/login

with something similar to:

{
  "email": "user@example.com",
  "password": "password"
}
7. Backend Authentication

The Express backend receives the request.

The flow is:

Login request
     ↓
Find user by email
     ↓
User exists?
   /     \
 No       Yes
 ↓         ↓
Error    bcrypt.compare()
             ↓
       Password correct?
          /       \
        No         Yes
        ↓           ↓
      Error       Generate JWT
                      ↓
                  Return token

The password is never stored as plain text.

The database stores a bcrypt hash.

8. Successful Login

The backend returns information such as:

{
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "name": "Amrith",
    "email": "user@example.com"
  }
}

The frontend stores the authentication information.

For the implementation you described, the JWT is persisted using browser storage.

Conceptually:

localStorage
 ├── token
 └── user
9. What Happens Immediately After Login?

Several things happen.

Successful Login
       ↓
Store JWT
       ↓
Update Auth Context
       ↓
Update current user
       ↓
Connect Socket.IO
       ↓
Join user's private socket room
       ↓
Navigate to application

The user is then taken to the main chat interface.

10. Main Application UI

The main interface behaves similarly to WhatsApp Web.

A typical layout:

┌───────────────────────────────────────────────────────────┐
│ Header                                                     │
├───────────────────┬───────────────────────────────────────┤
│                   │                                       │
│ Search            │ Chat Header                           │
│                   │                                       │
│ Conversations     │                                       │
│                   │                                       │
│ ───────────────   │                                       │
│ John              │          Messages                     │
│ Last message      │                                       │
│                   │                                       │
│ Sarah             │                                       │
│ Last message      │                                       │
│                   │                                       │
│ Mike              │                                       │
│ Last message      │                                       │
│                   │                                       │
│                   ├───────────────────────────────────────┤
│                   │ Message input          Send           │
└───────────────────┴───────────────────────────────────────┘

The interface consists primarily of:

Application header
User/profile area
Search
Conversation list
Chat window
Message input
Message actions
11. Authentication Context

The frontend maintains authentication globally.

Conceptually:

AuthContext
   │
   ├── currentUser
   ├── token
   ├── login()
   ├── logout()
   └── authentication status

This allows components throughout the application to know:

Who is currently logged in?

without repeatedly querying the login page.

12. Protected Routes

The application uses protected routes.

For example:

/login
/register

are public.

But:

/chat
/dashboard
/profile

require authentication.

The routing logic is essentially:

User requests protected page
          ↓
       Token?
       /    \
     No      Yes
     ↓        ↓
 Login      Allow

This prevents unauthenticated users from directly accessing the chat interface.

13. Socket.IO Connection

After successful authentication, the frontend establishes a persistent Socket.IO connection.

Conceptually:

React Application
       │
       │ Socket.IO
       ↓
Node.js Socket Server

This connection stays alive while the user is using the application.

The purpose is to allow instant communication without repeatedly polling the server.

14. Private Socket Rooms

Each user can have an isolated room.

Conceptually:

User A
Room: user_101


User B
Room: user_205

When User A sends a message to User B:

User A
  ↓
Socket Server
  ↓
User B's room
  ↓
User B

This prevents messages from being broadcast to unrelated users.

15. User Registration

A new user can select:

Create Account / Register

The registration screen contains:

Full name
Email
Password
Confirm password
Register button

The frontend validates the fields.

The backend:

Checks whether email already exists.
Hashes password using bcrypt.
Creates user record.
Stores profile information.
Returns registration result.
16. User Profile

The application stores information such as:

User
├── ID
├── Full Name
├── Email
├── Profile Picture
└── Status/Bio

Profile pictures are automatically generated using the configured avatar service.

The profile can be displayed in:

Header
Search results
Conversation list
Chat header
Profile section
17. Searching for Users

One of the important functions is finding another registered user.

The user can enter a name/email into the search field.

Example:

Search users...

Suppose the user enters:

rahul

The frontend sends a request to the backend.

Conceptually:

Search input
     ↓
API request
     ↓
Express
     ↓
SQLite
     ↓
Matching users
     ↓
Frontend
18. Search Results UI

The results appear below the search field.

Example:

Search users...


┌─────────────────────────────┐
│ 👤 Rahul Kumar              │
│    rahul@example.com        │
└─────────────────────────────┘


┌─────────────────────────────┐
│ 👤 Rahul S                  │
│    rahuls@example.com       │
└─────────────────────────────┘

The current user should normally not be presented as someone to start a conversation with themselves.

19. Selecting a User

When the user clicks a search result:

Search Result
      ↓
Selected User
      ↓
Open/Create Chat

The application checks whether a conversation already exists.

Existing conversation

Open it.

No existing conversation

Create/initialize the conversation.

20. Chat Creation

The backend can create a private conversation between:

User A
+
User B

Conceptually:

Chat
├── chatId
├── participant A
└── participant B

The frontend then selects that chat.

21. Chat Header

Once a chat is opened, the header displays the other user's information.

For example:

┌─────────────────────────────────────────────┐
│ 👤 Rahul Kumar                              │
│    Online                                    │
└─────────────────────────────────────────────┘

Possible information:

Profile image
Full name
Online status
Last seen/status
22. Loading Message History

When a conversation opens, the frontend retrieves existing messages from the REST API.

Conceptually:

Open Chat
   ↓
GET messages
   ↓
Backend
   ↓
SQLite
   ↓
Messages
   ↓
Frontend

The messages are then displayed chronologically.

Example:

          Yesterday


              Hello!
       10:31 AM


How are you?
       10:32 AM


              I'm good!
       10:33 AM
23. Message Structure

A message typically contains information such as:

Message
├── id
├── chatId
├── senderId
├── content
├── timestamp
├── read status
└── reaction information
24. Sending a Message

The message input is located at the bottom of the chat.

Example:

┌─────────────────────────────────────────────┐
│ Type a message...                     [➤]  │
└─────────────────────────────────────────────┘

The user types:

Hello Rahul!

and clicks Send or presses Enter.

25. Message Sending Architecture

The application uses the dual communication architecture.

Conceptually:

                User types message
                       ↓
                    Send
                       ↓
             ┌─────────┴─────────┐
             ↓                   ↓
         Socket.IO            REST API
             ↓                   ↓
      Instant delivery       Persistence
             ↓                   ↓
       Receiver UI           SQLite

Socket.IO provides the immediate experience.

The REST API/database ensures the message is permanently stored.

26. Message Appearing Instantly

When User A sends:

Hello!

the UI should immediately reflect the outgoing message.

Example:

                          Hello!   ✓

The user shouldn't need to refresh the page.

27. Receiver Side

User B is connected to the socket.

The server receives the event and routes it to User B.

User A
  ↓
Socket Server
  ↓
User B
  ↓
React state update
  ↓
Message appears

User B sees:

Hello!
10:45 AM

without refreshing.

28. Message Persistence

At the same time, the message is saved in SQLite.

This is important because Socket.IO alone isn't sufficient for permanent history.

After the user closes the browser:

Message
   ↓
SQLite
   ↓
Stored permanently

When the user returns later:

Open chat
   ↓
Fetch messages
   ↓
Previously stored messages appear
29. Optimistic UI Behavior

A good messaging interface should feel instant.

When the sender clicks Send:

Click Send
   ↓
Immediately append message to UI
   ↓
Send to backend

This avoids the interface feeling slow while waiting for the database request.

If the server reports an error, the UI can mark the message as failed or remove it.

30. Enter Key Behavior

The message field can support:

Enter → Send

while:

Shift + Enter

can optionally create a new line if multiline messaging is supported.

31. Empty Messages

The application should not send:

""

or:

"     "

The Send button should either:

remain disabled, or
ignore whitespace-only messages.
32. Typing Indicator

Socket.IO can be used for typing indicators.

When User A types:

Hello...

the frontend emits a typing event.

Conceptually:

User A
  ↓
typing event
  ↓
Socket server
  ↓
User B

User B sees:

Rahul is typing...

When typing stops:

Rahul

or the indicator disappears.

33. Online/Offline Status

Socket connection state can be used to determine availability.

Conceptually:

Socket connected
      ↓
User online


Socket disconnected
      ↓
User offline

The chat header may show:

● Online

or:

Offline
34. Read Receipts

The application can support read receipts through Socket.IO.

For example:

✓

means sent.

✓✓

means delivered.

A different visual state can indicate:

✓✓

read/seen.

The exact visual treatment depends on the UI implementation.

The flow is:

Message received
       ↓
User opens chat
       ↓
Read event
       ↓
Socket.IO
       ↓
Sender UI updated
35. Emoji Reactions

A user can react to a message.

Example:

              That's great!
                    ❤️

The reaction can be sent through Socket.IO for immediate UI updates and persisted through the backend.

Flow:

User selects emoji
       ↓
Message reaction event
       ↓
Socket server
       ↓
Receiver UI
       ↓
Persist reaction
36. Conversation List

The left sidebar contains conversations.

For example:

Chats


🔎 Search


Rahul Kumar
How are you?
10:42 AM


Anjali
See you tomorrow
Yesterday


Vishnu
Okay
Monday

Each conversation item can display:

Avatar
Name
Last message
Last message time
Unread count
Online status
37. Sidebar Behavior After Sending

Suppose the current conversation is:

Rahul

and you send:

I'll call you later.

The sidebar should immediately update:

Rahul
I'll call you later.       10:50 AM

No page refresh should be necessary.

38. Receiving a Message While Viewing Another Chat

Suppose User A is chatting with Rahul.

Another user, Anjali, sends a message.

The application receives it through Socket.IO.

Because Anjali's chat isn't currently selected:

Anjali
Are you free?

The sidebar can update:

Anjali
Are you free?              10:52 AM
                         [1]

where [1] represents an unread count.

39. Opening an Unread Conversation

When the user clicks Anjali:

Unread count
     ↓
Open chat
     ↓
Load messages
     ↓
Mark messages as read
     ↓
Unread indicator disappears

A read event can be emitted through Socket.IO.

40. Message Ordering

Messages should appear chronologically.

For example:

10:00  Hi
10:01  How are you?
10:02  I'm good
10:03  Great!

The backend should return messages in a consistent order, and the frontend should maintain that order when appending real-time messages.

41. Duplicate Message Prevention

Because the application uses both REST and Socket.IO, care must be taken to avoid displaying the same message twice.

For example:

REST response
+
Socket response

should not result in:

Hello
Hello

The frontend should identify messages by a unique message ID.

Conceptually:

if message.id already exists:
      don't append
else:
      append

This is an important part of a reliable real-time messaging application.

42. Page Refresh

Suppose the user refreshes the browser.

The application should:

Refresh
 ↓
Read JWT
 ↓
Restore authentication
 ↓
Reconnect Socket.IO
 ↓
Load conversations
 ↓
Load selected chat
 ↓
Fetch message history

The user should not have to log in again as long as the authentication token remains valid.

43. Browser Tab Closing

When the browser/tab closes:

Browser closes
     ↓
Socket disconnects
     ↓
Server recognizes disconnection
     ↓
User becomes offline

The messages already stored in SQLite remain available.

44. API Authorization

Protected backend APIs require authentication.

The frontend sends:

Authorization: Bearer <JWT>

The backend's authentication middleware:

Request
 ↓
Read JWT
 ↓
Verify JWT
 ↓
Valid?
 /   \
No    Yes
↓      ↓
401   Continue

This prevents unauthorized access.

45. Direct URL Access

Suppose someone manually enters:

/chat

without being logged in.

The protected route checks authentication.

If there is no valid token:

/chat
 ↓
Not authenticated
 ↓
Redirect
 ↓
/login
46. Logout Flow

Logout should be available from the profile/menu area.

For example:

Profile
────────────
My Profile
Settings
Logout

The user clicks:

Logout
47. Logout Process

The logout sequence is:

Click Logout
       ↓
Clear authentication state
       ↓
Remove JWT/token
       ↓
Disconnect Socket.IO
       ↓
Clear user/session state
       ↓
Redirect to Login

Conceptually:

localStorage
     ↓
remove token

and:

Socket.IO
     ↓
disconnect()
48. After Logout

The user is redirected to:

/login

The protected pages are no longer accessible.

If the user tries:

/chat

they are redirected back to:

/login
49. Complete End-to-End Example

Let's follow an actual conversation.

Step 1 — Amrith opens the application
Browser
 ↓
React loads
 ↓
Check localStorage

No token exists.

→ Login page
Step 2 — Amrith logs in
Email
Password
   ↓
POST /api/auth/login

Backend:

Find user
 ↓
bcrypt password verification
 ↓
Generate JWT
 ↓
Return JWT

Frontend:

Store JWT
 ↓
Update AuthContext
 ↓
Connect Socket.IO
 ↓
Open Chat UI
Step 3 — Search Rahul

Amrith types:

Rahul

The frontend queries the user API.

Results:

Rahul Kumar
rahul@example.com
Step 4 — Click Rahul

The application checks whether a chat exists.

If it exists:

Open chat

If not:

Create chat
 ↓
Open chat
Step 5 — Load conversation

Frontend:

GET /api/chats/...
GET /api/messages/...

Backend:

SQLite
 ↓
Historical messages

The messages appear.

Step 6 — Send message

Amrith types:

Hi Rahul!

and presses Enter.

Frontend immediately updates:

Hi Rahul!      ✓

Socket.IO sends the real-time event.

The API/database persists the message.

Step 7 — Rahul receives it

Rahul's browser receives the Socket.IO event:

new_message

His UI updates immediately:

Hi Rahul!

No refresh.

Step 8 — Rahul types

Rahul starts typing.

Socket event:

typing

Amrith sees:

Rahul is typing...
Step 9 — Rahul replies

Rahul sends:

Hi Amrith!

Amrith's UI immediately shows:

Hi Rahul!              ✓✓
                       Hi Amrith!
Step 10 — Amrith leaves the chat

The message remains in SQLite.

If Amrith returns tomorrow:

Open Rahul chat
       ↓
Fetch historical messages
       ↓
Previous conversation restored
Step 11 — Logout

Amrith clicks:

Profile → Logout

The application:

Clear JWT
 ↓
Clear auth state
 ↓
Disconnect Socket.IO
 ↓
Redirect /login

The session is finished.

50. Complete Architecture Flow

The entire system can be represented as:

                         ┌──────────────────────┐
                         │       Browser        │
                         │      React/Vite      │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┴────────────────┐
                  │                                  │
                  ▼                                  ▼
           REST API / Axios                     Socket.IO
                  │                                  │
                  ▼                                  ▼
          Express Controllers                  Socket Handler
                  │                                  │
                  ▼                                  ▼
          Services / Logic                     Real-time events
                  │                                  │
                  ▼                                  │
             Repository                             │
                  │                                  │
                  ▼                                  │
                SQLite                              │
                  │                                  │
                  └──────────────┬───────────────────┘
                                 │
                                 ▼
                          Persistent data
51. REST API vs Socket.IO

This distinction is particularly important when explaining the project in an interview.

Feature	REST API	Socket.IO
Login	✅	❌
Registration	✅	❌
Search users	✅	❌
Load chats	✅	❌
Load old messages	✅	❌
Save messages	✅	Can trigger event
Instant messages	❌	✅
Typing indicator	❌	✅
Read receipts	❌	✅
Reactions	Can persist	✅ Real-time
Online status	❌	✅
Logout	Frontend/API	Disconnect

The important architectural idea is:

REST handles reliable data retrieval and persistence, while Socket.IO handles real-time communication.

52. Database-Level Flow

The important entities are conceptually:

Users
 │
 ├──────────────┐
 │              │
 ▼              ▼
Chats         Messages
 │              │
 │              ├── sender
 │              ├── receiver/chat
 │              ├── content
 │              └── timestamp
 │
 └── participants

A user can participate in multiple chats.

A chat contains multiple messages.

Each message belongs to a particular conversation and sender.

53. Error Handling

The application should handle failures gracefully.

Invalid login
Invalid email/password

→ Show error message.

User doesn't exist
User not found

→ Show appropriate feedback.

Network failure
Unable to connect to server

→ Don't crash the application.

Socket disconnect

The UI can indicate:

Reconnecting...

and attempt to reconnect.

Message failure

The message can be marked as:

Failed to send
↻ Retry

if such behavior is implemented.

54. Loading States

Professional UI should show loading states during asynchronous operations.

Login
[ Logging in... ]
Search
Searching...
Loading chats
Loading conversations...
Loading messages
Loading messages...

This prevents the user from thinking the application is frozen.

55. Empty States

The application should also have useful empty states.

No conversations
No conversations yet.


Search for a user to start chatting.
No search results
No users found.
Empty chat
No messages yet.


Say hello 👋
56. Responsive Behavior

On desktop:

┌──────────────┬─────────────────────┐
│ Chat List    │ Conversation        │
│              │                     │
│              │                     │
└──────────────┴─────────────────────┘

On smaller screens:

Chat List
    ↓
Conversation

The UI can switch between the conversation list and selected chat to maximize available screen space.

57. Security Flow

Authentication security:

Password
   ↓
bcrypt
   ↓
Password hash
   ↓
SQLite

Login:

Credentials
   ↓
bcrypt verification
   ↓
JWT

API:

JWT
 ↓
Authorization middleware
 ↓
Protected resource

The backend should never trust the frontend alone for authorization.

58. What Happens When an Unauthorized Request Is Made?

Example:

GET /api/messages

without a valid JWT.

Backend:

JWT missing/invalid
       ↓
401 Unauthorized

Frontend can respond by:

Clear authentication
 ↓
Redirect to login
59. Full UI State Lifecycle

The frontend essentially moves through these states:

UNAUTHENTICATED
       ↓
AUTHENTICATING
       ↓
AUTHENTICATED
       ↓
SOCKET_CONNECTED
       ↓
CHAT_SELECTED
       ↓
MESSAGING
       ↓
SOCKET_DISCONNECTED / RECONNECTING
       ↓
LOGOUT
       ↓
UNAUTHENTICATED
60. Complete User Flow — One-Line Version

For documentation/interview purposes, you can describe the entire application like this:

When the application starts, React checks for a persisted JWT token. If the user is authenticated, the application restores the session, connects to the Socket.IO server, and loads the chat interface. Users can search for registered users through the REST API and open or create private conversations. When a conversation is opened, previous messages are retrieved from the Express API and SQLite database. New messages are sent through the real-time Socket.IO connection for instant delivery while also being persisted through the backend. Typing indicators, read receipts, reactions, and online status are handled through Socket.IO events. The React state is updated immediately so the interface behaves without page refreshes. When the user logs out, the JWT is removed, authentication state is cleared, the Socket.IO connection is disconnected, and the user is redirected to the login screen.

61. Interview-Level Architecture Explanation

If an interviewer asks:

"Explain how your chat application works."

A strong answer would be:

"My application is a full-stack real-time messaging system built with React and Vite on the frontend and Node.js, Express and SQLite on the backend. I use JWT-based authentication and bcrypt for password hashing. After login, the JWT is persisted on the client and used to authorize protected API requests. The application uses a dual communication architecture. REST APIs handle operations that require persistence, such as authentication, user search, chat retrieval and historical message retrieval. Socket.IO maintains a persistent bidirectional connection for real-time operations such as sending messages, typing indicators, read receipts, reactions and online status. When a user sends a message, the UI updates immediately and the message is sent through the real-time socket while being persisted through the backend. The receiver gets the message through their Socket.IO connection without refreshing the page. React Context/state management keeps the authentication and chat UI synchronized, while React Router handles protected navigation. On logout, the token and authentication state are cleared and the socket connection is disconnected."

That is the core technical story of your application.

62. Final End-to-End Flow Diagram
                         USER OPENS APP
                               │
                               ▼
                     Check JWT in storage
                               │
                    ┌──────────┴──────────┐
                    │                     │
                JWT valid              No JWT
                    │                     │
                    ▼                     ▼
              Restore session           LOGIN
                    │                     │
                    ▼                     ▼
             Connect Socket.IO       POST /login
                    │                     │
                    │                  Verify
                    │                  password
                    │                     │
                    │                     ▼
                    │                  Generate JWT
                    │                     │
                    └──────────┬──────────┘
                               │
                               ▼
                         CHAT DASHBOARD
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
            Search users                Conversations
                 │                           │
                 └─────────────┬─────────────┘
                               ▼
                         Select user
                               │
                               ▼
                      Open/create chat
                               │
                               ▼
                    Fetch message history
                               │
                               ▼
                         DISPLAY CHAT
                               │
                  ┌────────────┼────────────┐
                  │            │            │
                  ▼            ▼            ▼
               Message      Typing       Reaction
                  │            │            │
                  ▼            ▼            ▼
              Socket.IO     Socket.IO    Socket.IO
                  │            │            │
                  ▼            ▼            ▼
              Receiver       Receiver     Receiver
                  │
                  ▼
             Persist message
                  │
                  ▼
                SQLite
                  │
                  ▼
             Future history
                  │
                  ▼
               LOGOUT
                  │
          ┌───────┼────────┐
          ▼       ▼        ▼
       Clear JWT  Clear   Disconnect
                  state    Socket
          │
          └─────────┬─────────┘
                    ▼
                 LOGIN

This gives you the complete functional, UI, backend, database, authentication, and real-time flow of the application from beginning to end.