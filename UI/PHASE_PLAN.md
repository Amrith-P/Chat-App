Yes. The better architecture is to change the application from **"any user can start chatting with any other user"** to a **friend-based messaging system**:

**Search user → Send Friend Request → Other user accepts → They become friends → Chat becomes available.**

Before friendship is established, there should be **no normal chat access** between those users.

Here is a complete prompt you can give to your coding agent.

# Implement Friend-Based Messaging System in ChatApp Pro

You are working on an existing full-stack real-time messaging application called **ChatApp Pro**.

The application currently allows users to search for other users and start private conversations. Change this behavior into a proper **friend-based social messaging system**.

The new rule is:

> **Users can only start a private chat after both users have become friends.**

A user must first send a friend request. The other user must accept the request. Only after acceptance should the two users be allowed to communicate through private chat.

Do not create a separate application or rewrite the existing architecture.

First inspect the existing codebase and integrate this feature into the existing:

* React
* Vite
* JavaScript
* Tailwind CSS
* Shadcn UI
* React Router DOM
* Node.js
* Express
* SQLite
* JWT
* Socket.IO
* Existing Context/state management
* Existing chat components

The existing group-chat functionality should continue to work alongside this new friend system.

---

# 1. New Application Concept

The application should now work like this:

```text
User searches for another user
            ↓
User views profile
            ↓
User clicks "Add Friend"
            ↓
Friend request is created
            ↓
Recipient receives real-time notification
            ↓
Recipient opens "Requests"
            ↓
Recipient sees request
            ↓
Accept
     ↓
Both users become friends
            ↓
"Message" button becomes available
            ↓
Private chat can now be started
```

If the recipient rejects the request:

```text
Request rejected
        ↓
No friendship
        ↓
No chat
```

If the recipient accepts:

```text
Friendship created
        ↓
Both users appear in each other's Friends list
        ↓
Private conversation becomes available
```

---

# 2. Important Business Rule

This is the most important requirement:

## Users cannot privately message non-friends.

The backend must enforce this.

Do NOT simply hide the "Message" button on the frontend.

For example:

```text
User A
   ↓
tries POST /api/messages
   ↓
Backend checks friendship
   ↓
Not friends
   ↓
403 Forbidden
```

Even if someone manually calls the API, they must not be able to message another user unless a friendship exists.

The same rule must apply to:

* REST APIs
* Socket.IO
* conversation creation
* message sending
* typing indicators
* read receipts
* reactions
* private chat room access

---

# 3. New Sidebar Structure

Redesign the sidebar navigation to contain clear sections.

Recommended structure:

```text
┌──────────────────────────────┐
│ ChatApp Pro                  │
│                              │
│ 🔍 Search                    │
│                              │
│ 💬 Chats                     │
│ 👥 Friends                   │
│ 🔔 Requests             ● 3 │
│                              │
│ ──────────────────────────── │
│                              │
│ Conversations                │
│                              │
│ John                         │
│ Sarah                        │
│ Project Team                 │
│                              │
└──────────────────────────────┘
```

The exact visual structure should follow the existing application's design.

Do not unnecessarily change the overall layout.

---

# 4. Sidebar Tabs

Create three primary social/chat sections:

## Chats

Displays:

* Private conversations
* Group conversations

Only private conversations with existing friends should appear.

---

## Friends

Displays the user's friends.

Features:

* Search friends
* Friend list
* Online status if the application already supports it
* Profile picture
* Name
* Message button
* Friend options menu

---

## Requests

Displays:

* Incoming friend requests
* Outgoing/pending friend requests

The Requests tab must display a notification dot/count whenever there are pending incoming requests.

---

# 5. Friend Request Notification Dot

When a new incoming friend request arrives:

```text
Requests ●
```

or:

```text
Requests    3
```

depending on the design.

The notification should update in real time through Socket.IO.

For example:

```text
John sends friend request to Sarah
              ↓
Sarah's Socket.IO connection
              ↓
friend-request-received
              ↓
Requests badge changes from:
Requests
to:
Requests ●
```

Do not require Sarah to refresh the page.

---

# 6. Notification Behavior

If there is one pending incoming request:

```text
Requests ●
```

If there are three:

```text
Requests 3
```

If the user opens the Requests page and all requests are considered viewed:

```text
Requests
```

However, do not automatically delete or reject requests simply because the user opened the page.

The notification state and request state are different concepts.

The actual request remains:

```text
pending
```

until:

* accepted
* rejected
* cancelled

---

# 7. Database Design

Inspect the existing database first.

If no suitable friendship system exists, create a normalized friendship/request structure.

Do NOT store friends as:

```text
user.friends = "2,5,8,12"
```

Do not store friend IDs as comma-separated strings.

Use relational tables.

---

# 8. Friend Requests Table

Create something similar to:

```text
friend_requests
----------------
id
sender_id
receiver_id
status
created_at
updated_at
```

Status values:

```text
pending
accepted
rejected
cancelled
```

Alternatively, once accepted, move the relationship into a separate friendships table.

Recommended approach:

* `friend_requests` = tracks request lifecycle
* `friendships` = tracks actual friendship

---

# 9. Friendships Table

Create:

```text
friendships
-----------
id
user_id
friend_id
created_at
```

However, prevent duplicate relationships.

For example:

```text
User A → User B
```

must represent the same friendship as:

```text
User B → User A
```

Do not accidentally create two separate friendships.

A better normalized structure can use:

```text
user_one_id
user_two_id
```

with the smaller user ID always stored first.

Example:

```text
User IDs: 5 and 12

user_one_id = 5
user_two_id = 12
```

This prevents:

```text
5 → 12
12 → 5
```

from becoming two separate friendship records.

---

# 10. Friend Request Rules

The backend must enforce the following.

### User cannot send request to themselves

```text
User A → User A
```

must return an error.

---

### Cannot send duplicate pending request

If:

```text
A → B = pending
```

A cannot send another request.

---

### Reverse pending request

If:

```text
A → B = pending
```

and B tries to send:

```text
B → A
```

do NOT create another request.

Instead, handle it intelligently.

Recommended behavior:

```text
B tries Add Friend
        ↓
System detects A already sent request
        ↓
Show:
"John has already sent you a friend request."
        ↓
Offer:
Accept Request
```

---

### Cannot send request to existing friend

If A and B are already friends:

```text
Add Friend
```

must not be available.

Show:

```text
Friends
```

and:

```text
Message
```

instead.

---

### Cannot send request to blocked user

If blocking is implemented later, blocked users must not be able to send requests.

Design the system so blocking can be added later.

---

# 11. User Search Behavior

The existing user search should be changed.

When searching for:

```text
John Doe
```

the result should show relationship state.

Example:

```text
┌─────────────────────────────────┐
│ [Avatar] John Doe               │
│         john@example.com        │
│                                 │
│              Add Friend         │
└─────────────────────────────────┘
```

If already friends:

```text
┌─────────────────────────────────┐
│ [Avatar] John Doe               │
│         john@example.com        │
│                                 │
│       ✓ Friends    Message      │
└─────────────────────────────────┘
```

If request already sent:

```text
┌─────────────────────────────────┐
│ [Avatar] John Doe               │
│         john@example.com        │
│                                 │
│          Request Sent           │
└─────────────────────────────────┘
```

If they sent you a request:

```text
┌─────────────────────────────────┐
│ [Avatar] John Doe               │
│         john@example.com        │
│                                 │
│        Accept Request           │
└─────────────────────────────────┘
```

If request was rejected:

Allow the appropriate behavior according to the product rules.

Recommended:

```text
Add Friend
```

can become available again after rejection.

---

# 12. Relationship State

Do not make the frontend guess the relationship.

The backend should return a clear relationship status.

For example:

```json
{
  "user": {
    "id": 12,
    "name": "John Doe",
    "avatar": "..."
  },
  "relationship": "friend"
}
```

Possible values:

```text
none
friend
request_sent
request_received
request_rejected
```

This makes the UI predictable.

---

# 13. Add Friend Flow

When the user clicks:

```text
Add Friend
```

show a loading state:

```text
Sending...
```

Then:

```text
Request Sent
```

Do not allow the user to click it repeatedly.

Backend:

```text
POST /api/friend-requests
```

Request:

```json
{
  "receiverId": 12
}
```

The sender ID must come from the authenticated JWT.

Never accept:

```json
{
  "senderId": 5,
  "receiverId": 12
}
```

and blindly trust `senderId`.

---

# 14. Friend Request API

Implement clean endpoints based on the existing API conventions.

Recommended:

```http
POST   /api/friend-requests
GET    /api/friend-requests
GET    /api/friend-requests/incoming
GET    /api/friend-requests/outgoing
POST   /api/friend-requests/:id/accept
POST   /api/friend-requests/:id/reject
DELETE /api/friend-requests/:id
```

Adjust naming to match the existing application.

---

# 15. Incoming Requests

Requests tab should display incoming requests first.

Example:

```text
Friend Requests

┌─────────────────────────────────────┐
│ [Avatar] John Doe                   │
│          john@example.com           │
│                                     │
│          [Accept] [Decline]         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Avatar] Sarah Smith                │
│          sarah@example.com          │
│                                     │
│          [Accept] [Decline]         │
└─────────────────────────────────────┘
```

Each request should display:

* profile picture
* full name
* username/email if appropriate
* request time
* Accept button
* Decline button

---

# 16. Accept Request

When the user clicks:

```text
Accept
```

the backend must perform an atomic operation.

Conceptually:

```text
BEGIN TRANSACTION

Update friend request
        ↓
status = accepted

Create friendship
        ↓
COMMIT
```

Do not create the friendship if the request update fails.

Do not update the request without creating the friendship.

---

# 17. After Accepting

Immediately update:

### Requests

Remove the request.

### Friends

Add the new friend.

### Search result

Change:

```text
Accept Request
```

to:

```text
Friends
Message
```

### Chat

The user can now start a private chat.

### Other user

The sender should receive a real-time notification:

```text
John accepted your friend request.
```

---

# 18. Friend Request Socket Events

Use the existing Socket.IO connection.

Do NOT create another socket connection.

Add events such as:

```text
friend-request-sent
friend-request-received
friend-request-accepted
friend-request-rejected
friend-request-cancelled
friendship-created
friendship-removed
```

---

# 19. New Request Real-Time Flow

Example:

```text
John
  ↓
POST /api/friend-requests
  ↓
Backend
  ↓
Save request
  ↓
Find Sarah's active socket
  ↓
emit:
friend-request-received
  ↓
Sarah's UI
  ↓
Requests badge updates
  ↓
Requests list updates
```

Sarah must see the request without refreshing.

---

# 20. Friend Acceptance Real-Time Flow

```text
Sarah clicks Accept
        ↓
POST /api/friend-requests/15/accept
        ↓
Backend transaction
        ↓
Create friendship
        ↓
Emit friendship-created
        ↓
John receives event
        ↓
John's Friends list updates
        ↓
John's search result updates
        ↓
"Message" becomes available
```

---

# 21. Friends Tab

Create a dedicated Friends screen.

Example:

```text
┌────────────────────────────────────────┐
│ Friends                                │
│                                        │
│ 🔍 Search friends...                   │
│                                        │
│ 24 Friends                             │
│                                        │
│ [Avatar] John Doe              Message │
│          Online                        │
│                                        │
│ [Avatar] Sarah Smith           Message │
│          Offline                       │
│                                        │
│ [Avatar] Alex Thomas           Message │
└────────────────────────────────────────┘
```

---

# 22. Friends Search

The Friends tab must have its own search.

Example:

```text
Search friends...
```

Typing:

```text
sar
```

shows only friends whose:

* name
* username
* email

matches the search.

Do not search every registered user from this field.

This is specifically:

```text
My Friends
```

search.

---

# 23. Friends Sorting

Recommended sorting:

1. Recently active friends
2. Online friends
3. Alphabetical

Or simply use:

```text
Most recently interacted
```

if the existing chat application already uses this pattern.

Keep the behavior predictable.

---

# 24. Friend Item

Each friend should show:

```text
[Avatar]
John Doe
Online
```

with actions:

```text
Message
⋮
```

The menu can contain:

```text
View Profile
Message
Remove Friend
```

If you implement unfriend functionality.

---

# 25. Remove Friend

Implement:

```text
Remove Friend
```

with confirmation.

Example:

```text
Remove Friend?

Are you sure you want to remove John from your friends?

You will no longer be able to message each other.

[Cancel] [Remove Friend]
```

After removal:

* delete friendship
* remove from Friends tab
* disable private messaging
* optionally archive the existing conversation
* remove access to private chat room
* notify the other user

---

# 26. What Happens to Existing Chat After Unfriending?

Use this product rule:

## Recommended behavior

When two users unfriend each other:

```text
Friendship removed
        ↓
New messages blocked
        ↓
Existing messages remain stored
        ↓
Conversation becomes inaccessible for sending
```

You may show:

```text
You are no longer friends with John.

Add John as a friend again to continue chatting.
```

Do not automatically delete historical messages unless the product explicitly requires that.

---

# 27. Private Chat Access

This is critical.

Before opening a private chat:

```text
GET /api/chats/:userId
```

backend checks:

```text
Are currentUser and userId friends?
```

If yes:

```text
allow
```

If no:

```text
403
```

Frontend should show:

```text
You can only chat with friends.

[View Profile]
[Add Friend]
```

---

# 28. Private Chat Creation

If your application currently automatically creates a conversation when the user clicks another user, change this.

Old behavior:

```text
Search user
      ↓
Click user
      ↓
Conversation created
```

New behavior:

```text
Search user
      ↓
Click user
      ↓
Profile/relationship view
      ↓
Add Friend
      ↓
Wait for acceptance
      ↓
Friendship established
      ↓
Message button becomes available
      ↓
Conversation can be created/opened
```

---

# 29. Message API Security

Every private message endpoint must validate friendship.

For example:

```text
POST /api/messages
```

Backend:

```text
authenticated user
        ↓
recipient exists?
        ↓
are users friends?
        ↓
YES → save message
NO  → 403 Forbidden
```

Never rely on:

```text
if (buttonIsVisible)
```

as security.

---

# 30. Socket.IO Private Chat Security

The same rule applies to Socket.IO.

Suppose User A tries:

```text
join-private-room-user-B
```

The server must verify:

```text
A and B are friends
```

before joining.

If not:

```text
private-chat-access-denied
```

Do not allow arbitrary private chat room access.

---

# 31. Typing Indicator Security

Typing indicators must also require friendship.

Before:

```text
private-typing
```

is broadcast:

```text
Are sender and recipient friends?
```

If not, reject it.

---

# 32. Read Receipts

Read receipts should only work between friends.

If two users become unfriends:

```text
private read receipt events
```

should no longer be accepted.

---

# 33. Message Reactions

Private message reactions should also respect the friendship/access rules.

If the user cannot access the conversation, they cannot react to its messages through the API.

---

# 34. Chats Tab Behavior

The Chats tab should show:

### Private chats

Only conversations with friends.

### Group chats

Groups the user belongs to.

Do NOT show random users simply because the user searched for them.

---

# 35. New Chat Button

Change the existing "New Chat" behavior.

Instead of:

```text
New Chat
→ Search all users
→ Start chatting
```

use:

```text
New Chat
→ Friends
→ Search friends
→ Select friend
→ Open conversation
```

Also provide:

```text
Add Friend
```

as a separate action.

---

# 36. Suggested New Chat Menu

When clicking:

```text
+
```

show:

```text
New Chat

💬 Message a Friend
👥 Create Group
➕ Add Friend
```

Behavior:

### Message a Friend

Opens Friends selector.

### Create Group

Opens group creation flow.

### Add Friend

Opens global user search.

---

# 37. Global User Search vs Friend Search

These must be different.

## Global User Search

Purpose:

```text
Find people to add as friends.
```

Can search all registered users.

Actions:

```text
Add Friend
Request Sent
Accept Request
Friends
```

---

## Friends Search

Purpose:

```text
Find someone you are already friends with.
```

Only searches the user's friend list.

Actions:

```text
Message
View Profile
Remove Friend
```

---

# 38. User Profile / Relationship View

When clicking a user from global search, show a compact profile.

Example:

```text
┌─────────────────────────────┐
│                             │
│          [Avatar]           │
│                             │
│        John Doe             │
│        john@example.com     │
│                             │
│       Add Friend            │
│                             │
└─────────────────────────────┘
```

After request:

```text
Request Sent
```

After acceptance:

```text
✓ Friends

[Message]
```

---

# 39. Friend Request Status UX

Use clear states.

### No relationship

```text
+ Add Friend
```

### Request sent

```text
Request Sent
```

with optional:

```text
Cancel Request
```

### Request received

```text
Accept
Decline
```

### Friends

```text
✓ Friends
Message
```

### Blocked

```text
Blocked
```

if blocking is implemented.

---

# 40. Cancel Friend Request

The sender should optionally be able to cancel a pending request.

Example:

```text
Request Sent
```

click:

```text
Cancel Request
```

Confirmation:

```text
Cancel friend request?

[Cancel] [Yes, Cancel Request]
```

Then:

```text
friend-request-cancelled
```

should be emitted.

---

# 41. Rejecting a Request

When recipient clicks:

```text
Decline
```

the request becomes:

```text
rejected
```

or is removed according to the database strategy.

Recommended:

Keep request history in the database but don't display it in the active Requests list.

The sender can later send another request if appropriate.

---

# 42. Request Counts

The backend should expose a simple count endpoint or include counts in the requests API.

For example:

```http
GET /api/friend-requests/count
```

Response:

```json
{
  "incoming": 3,
  "outgoing": 1
}
```

Use this to render the sidebar badge.

If the existing application already has a notification-count endpoint, integrate the count into that system instead.

---

# 43. Initial Page Load

When the user logs in:

```text
Authentication
      ↓
Load profile
      ↓
Load friends
      ↓
Load friend request count
      ↓
Load incoming requests
      ↓
Load chats
      ↓
Connect Socket.IO
```

Do not block the entire application unnecessarily while requests load.

Show skeleton/loading states.

---

# 44. Socket Reconnection

When Socket.IO reconnects:

```text
reconnect
   ↓
authenticate
   ↓
restore notification listeners
   ↓
refresh friend request count
   ↓
refresh friendship state if necessary
```

This prevents stale notification badges.

---

# 45. Friend List Real-Time Updates

If John accepts Sarah's request:

Sarah's UI should update automatically:

```text
Friends
  24
```

becomes:

```text
Friends
  25
```

and John appears in the list.

John should receive the corresponding event and see Sarah in his Friends list without refreshing.

---

# 46. Notification Architecture

If the application does not currently have a generalized notification system, do not build an unnecessarily complex notification platform.

For now implement:

```text
friend request notification
friend request accepted notification
```

using Socket.IO plus persisted request data.

Later this architecture can be extended to:

* message notifications
* group notifications
* mentions
* system notifications

---

# 47. Recommended Notification Events

Implement:

```text
friend-request-received
friend-request-accepted
friend-request-rejected
friend-request-cancelled
friendship-created
friendship-removed
```

Example:

```js
socket.emit("friend-request-received", {
    requestId,
    sender
});
```

Use the application's existing event naming conventions if they differ.

---

# 48. Request Notification Persistence

Do not rely exclusively on Socket.IO.

Suppose:

```text
John sends request
```

while Sarah is offline.

Sarah must still see the request when she logs in.

Therefore:

```text
Friend request → SQLite
```

is the source of truth.

Socket.IO is only for immediate synchronization.

---

# 49. Friends as Source of Truth

The friendship table is the source of truth.

Do not rely on:

```text
frontend.friendList
```

for authorization.

The backend must query the database.

---

# 50. API Authorization Helper

Create a reusable helper such as:

```text
areUsersFriends(userA, userB)
```

This should be used by:

* message controllers
* chat controllers
* socket handlers
* typing handlers
* read receipt handlers
* reaction handlers

This avoids duplicated friendship logic.

---

# 51. Conversation Authorization Helper

Create something like:

```text
requireFriendship(currentUserId, targetUserId)
```

or follow the application's existing middleware architecture.

Conceptually:

```text
JWT
 ↓
authenticated user
 ↓
friendship check
 ↓
authorized
```

---

# 52. Group Chats Are Different

Do NOT apply the friendship requirement to group chats in the same way.

Group membership controls group access.

For groups:

```text
Is user a group member?
```

For private chats:

```text
Are users friends?
```

These are separate authorization models.

---

# 53. Existing Group Chat Integration

The sidebar should now conceptually be:

```text
Chats
│
├── Private Conversations
│
└── Group Conversations

Friends
│
└── Friend List

Requests
│
└── Incoming / Outgoing Requests
```

A user can:

```text
Friend → Private Chat
```

and:

```text
Group Member → Group Chat
```

---

# 54. Recommended Sidebar Interaction

When user clicks:

## Chats

Show conversation list.

## Friends

Replace main content with Friends page.

## Requests

Replace main content with Requests page.

Do not necessarily navigate to completely separate browser routes unless the existing application architecture benefits from it.

If route-based navigation is already used, routes can be:

```text
/friends
/requests
/chats
```

or equivalent.

---

# 55. Friends Page Empty State

If the user has no friends:

```text
No friends yet

Find people you know and start connecting with them.

[Find Friends]
```

Clicking:

```text
Find Friends
```

opens global user search.

---

# 56. Requests Empty State

If there are no requests:

```text
No friend requests

When someone sends you a friend request,
it will appear here.
```

Use a polished Shadcn-based empty state.

---

# 57. Global Search Empty State

If no users match:

```text
No users found
```

Do not show:

```text
Start Chat
```

because users cannot chat without friendship.

---

# 58. Search Result Rules

Global search must never show:

```text
Message
```

for non-friends.

Instead:

```text
Add Friend
```

or:

```text
Request Sent
```

or:

```text
Accept Request
```

---

# 59. Existing Conversation Migration

Inspect existing database records.

If private conversations already exist between users who are not friends:

DO NOT blindly delete them.

Instead decide on a safe migration behavior.

Recommended:

* Preserve existing conversations/messages.
* Prevent new messages unless friendship exists.
* Optionally display a notice:

```text
You are not currently friends.

Add this user as a friend to continue chatting.
```

This protects existing data.

---

# 60. Database Migration Safety

Never:

```sql
DROP TABLE users;
DROP TABLE messages;
DROP TABLE chats;
```

Do not destroy existing user/chat/message data.

Create new tables or safely alter existing structures.

The migration must be backwards-compatible.

---

# 61. Security Requirements

The backend must prevent:

### Unauthorized messaging

Non-friend → friend

```text
403
```

### Unauthorized chat-room joining

Non-friend → private room

```text
denied
```

### Fake sender IDs

Never trust:

```json
{
  "senderId": 123
}
```

Sender comes from JWT.

### Fake friendship

Never trust:

```json
{
  "isFriend": true
}
```

Frontend state is not authoritative.

### Fake request sender

Never accept arbitrary sender IDs.

---

# 62. Race Conditions

Handle situations such as:

### Both users send requests simultaneously

A → B

and:

B → A

at nearly the same time.

The backend should resolve this cleanly.

Recommended behavior:

* detect the reverse pending request
* avoid duplicate requests
* allow one request to become the active request
* present the appropriate accept state

---

# 63. Concurrent Accept

If two requests are somehow accepted simultaneously:

Use database constraints/transactions to prevent duplicate friendships.

There must never be:

```text
friendship 1: A-B
friendship 2: A-B
```

---

# 64. Friend Request Database Constraints

Add appropriate indexes.

Especially:

```text
sender_id
receiver_id
status
```

and friendship lookup:

```text
user_one_id
user_two_id
```

Friendship checks happen frequently, so they must be efficient.

---

# 65. UI Confirmation Rules

Use Shadcn AlertDialog for destructive operations:

* Remove friend
* Cancel request
* Decline request if appropriate
* Leave group
* Delete group

Do not use browser:

```text
window.confirm()
```

if the application already uses Shadcn dialogs.

---

# 66. Toast Notifications

Use the application's existing toast system.

Examples:

```text
Friend request sent
```

```text
Friend request accepted
```

```text
Friend request declined
```

```text
Friend removed
```

```text
Unable to send friend request
```

Do not display raw server errors.

---

# 67. Loading States

Buttons must have loading states.

Example:

```text
Add Friend
```

becomes:

```text
Sending...
```

Accept:

```text
Accepting...
```

Remove:

```text
Removing...
```

Do not allow duplicate clicks.

---

# 68. Responsive Mobile Design

On mobile:

```text
☰
```

opens sidebar.

Sidebar:

```text
Chats
Friends
Requests
```

Selecting Friends or Requests should transition naturally into the main content.

The request badge should remain visible.

---

# 69. Dark Mode

All new screens must support the existing dark/light theme.

Check:

* Friends page
* Requests page
* Search results
* User profile
* Friend request cards
* dialogs
* badges
* menus
* empty states

Do not introduce hard-coded colors that conflict with the application's theme.

---

# 70. Final User Experience

The final application should feel like:

```text
                    ChatApp Pro
                         │
        ┌────────────────┼────────────────┐
        │                │                │
      Chats            Friends         Requests
        │                │                │
        │                │                │
 Private + Groups    My Friends      Incoming
 conversations       Search          Outgoing
        │                │                │
        │                │                │
        │             Message
        │                │
        └───────────────►│
                         │
                    Private Chat
```

---

# 71. Complete Example User Journey

## User A searches for User B

```text
Search
 ↓
User B
 ↓
Add Friend
```

Database:

```text
friend_requests
A → B
pending
```

User B receives:

```text
Requests ●
```

---

## User B opens Requests

```text
Friend Requests

User A

[Accept] [Decline]
```

B clicks:

```text
Accept
```

Database:

```text
friend_requests
A → B
accepted

friendships
A ↔ B
```

Both users receive:

```text
friendship-created
```

---

## User A

Friends tab:

```text
User B
```

Search result:

```text
✓ Friends
Message
```

---

## User A clicks Message

Now:

```text
Private Chat
```

is opened.

---

## User A sends:

```text
Hey!
```

Backend checks:

```text
A and B friends?
YES
```

Message saved.

Socket.IO:

```text
private-message
```

B receives it.

---

# 72. If User B Rejects

```text
A → B
pending
```

B:

```text
Decline
```

Then:

```text
A → B
rejected
```

No friendship.

A cannot message B.

Search result:

```text
Add Friend
```

can become available again.

---

# 73. If User A Cancels

```text
A → B
pending
```

A clicks:

```text
Cancel Request
```

Request is cancelled.

B's pending request notification disappears.

---

# 74. If They Unfriend

```text
A ↔ B
friends
```

A removes B.

Then:

```text
friendship deleted
```

Both users can no longer send new private messages.

Existing messages remain in the database.

UI:

```text
You are no longer friends.

[Add Friend]
```

---

# 75. Recommended Component Structure

Follow the existing project architecture.

Potential components:

```text
components/
├── friends/
│   ├── FriendsPage
│   ├── FriendList
│   ├── FriendListItem
│   ├── FriendSearch
│   ├── UserSearch
│   └── UserProfileCard
│
├── requests/
│   ├── RequestsPage
│   ├── IncomingRequestList
│   ├── OutgoingRequestList
│   ├── FriendRequestCard
│   └── RequestBadge
│
└── chat/
    └── existing components
```

Reuse existing components wherever possible.

---

# 76. Recommended Backend Structure

Adapt to the current project structure.

Potentially:

```text
controllers/
    friendController.js
    friendRequestController.js

routes/
    friendRoutes.js
    friendRequestRoutes.js

middleware/
    friendshipMiddleware.js

services/
    friendshipService.js
```

Do not blindly create all of these files.

Follow the existing architecture.

---

# 77. Testing Matrix

Test with at least three accounts:

```text
Alice
Bob
Charlie
```

### Scenario 1

Alice searches Bob.

Expected:

```text
Add Friend
```

### Scenario 2

Alice sends request.

Expected:

```text
Request Sent
```

Bob:

```text
Requests ●
```

### Scenario 3

Bob accepts.

Expected:

Alice:

```text
Friends → Bob
Message
```

Bob:

```text
Friends → Alice
Message
```

### Scenario 4

Alice sends message.

Expected:

```text
Success
```

### Scenario 5

Alice searches Charlie.

Expected:

```text
Add Friend
```

No Message button.

### Scenario 6

Alice manually calls message API for Charlie.

Expected:

```text
403 Forbidden
```

### Scenario 7

Alice attempts Socket.IO private room with Charlie.

Expected:

```text
Denied
```

### Scenario 8

Bob rejects Alice.

Expected:

```text
No friendship
No chat
```

### Scenario 9

Bob removes Alice.

Expected:

```text
Friendship removed
New messages blocked
```

### Scenario 10

Alice creates a group containing Bob and Charlie.

Expected:

```text
Group chat continues working
```

even though private friendship logic is separate.

---

# 78. Important Existing Feature Compatibility

After implementing the friend system, verify that all existing features still work:

* Login
* Registration
* Logout
* JWT authentication
* User search
* Private chat
* Message sending
* Message receiving
* Typing indicator
* Read receipts
* Reactions
* Group chat
* Group member management
* Group messages
* Profile pictures
* Profile information
* Sidebar
* Notifications
* Dark mode
* Responsive layout

Do not regress existing functionality.

---

# 79. Final Acceptance Criteria

The implementation is complete only when:

## Friend Requests

* [ ] User can search all users
* [ ] User can send friend request
* [ ] Duplicate request prevented
* [ ] Self-request prevented
* [ ] Reverse request handled
* [ ] User can cancel request
* [ ] User can accept request
* [ ] User can reject request
* [ ] Requests persist in SQLite
* [ ] Requests update in real time

## Requests Tab

* [ ] Requests tab exists
* [ ] Incoming requests displayed
* [ ] Outgoing requests displayed
* [ ] Notification dot appears
* [ ] Notification count works
* [ ] Notification updates in real time
* [ ] Empty state exists

## Friends

* [ ] Friends tab exists
* [ ] Friends displayed
* [ ] Friends searchable
* [ ] Friend count displayed
* [ ] Message button works
* [ ] Profile can be viewed
* [ ] Friend can be removed
* [ ] Friend removal updates in real time

## Private Chat Security

* [ ] Only friends can message
* [ ] Backend checks friendship
* [ ] Socket.IO checks friendship
* [ ] Private room access checks friendship
* [ ] Typing checks friendship
* [ ] Read receipts check friendship
* [ ] Reactions check conversation access

## Chat UI

* [ ] Chats only show valid private conversations
* [ ] Non-friends cannot appear as active chats
* [ ] New Chat opens friend selector
* [ ] Search users does not automatically create conversations
* [ ] Existing conversations are preserved safely

## Groups

* [ ] Group chat continues working
* [ ] Group membership is independent from friendship
* [ ] Group messages continue working
* [ ] Group permissions continue working

## Security

* [ ] JWT required
* [ ] Sender derived from authenticated user
* [ ] Friendship verified server-side
* [ ] SQL queries parameterized
* [ ] Socket rooms protected
* [ ] Unauthorized API access blocked

---

# 80. Final Implementation Instruction

Before writing code:

1. Inspect the existing database.
2. Inspect existing user schema.
3. Inspect existing chat/conversation schema.
4. Inspect existing message schema.
5. Inspect existing authentication middleware.
6. Inspect existing Socket.IO implementation.
7. Inspect existing sidebar.
8. Inspect existing user-search implementation.
9. Inspect existing chat creation logic.
10. Inspect existing frontend state management.

Then produce a short implementation plan based on the actual codebase.

After approval or immediately if operating autonomously, implement the feature incrementally.

Do not rewrite unrelated parts of the application.

Do not create duplicate systems.

Reuse the existing authentication, socket connection, UI components, state management, API conventions, and database utilities wherever possible.

The final application should behave according to this fundamental rule:

```text
                     SEARCH USERS
                          │
                          ▼
                    ADD FRIEND
                          │
                          ▼
                 FRIEND REQUEST
                          │
               ┌──────────┴──────────┐
               │                     │
            ACCEPT                 REJECT
               │                     │
               ▼                     ▼
           FRIENDS                NO CHAT
               │
               ▼
         PRIVATE CHAT
               │
               ▼
       REAL-TIME MESSAGING
```

And the sidebar should provide:

```text
┌──────────────────────────────┐
│ ChatApp Pro                  │
│                              │
│ 💬 Chats                     │
│ 👥 Friends                   │
│ 🔔 Requests             ● 2  │
│                              │
│ ──────────────────────────── │
│                              │
│ Conversations                │
│                              │
│ John Doe                     │
│ Sarah Smith                  │
│ 👥 Project Team              │
│ 👥 College Group             │
└──────────────────────────────┘
```

The end result should make ChatApp Pro behave as a **friend-based messaging platform**, where discovery, friendship, requests, private messaging, and group communication are clearly separated but seamlessly integrated.
