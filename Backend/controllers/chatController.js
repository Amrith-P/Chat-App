import db from '../config/db.js';

// @desc    Get all conversations for the logged in user
// @route   GET /api/chats
export const getUserChats = (req, res) => {
  const currentUserId = req.user.id;

  const query = `
    SELECT 
      c.id AS id,
      c.type,
      c.createdAt,
      u.id AS contactId,
      u.fullName AS name,
      u.email AS email,
      u.avatar AS avatar,
      u.status AS status,
      (
        SELECT content FROM messages 
        WHERE conversationId = c.id 
        ORDER BY createdAt DESC LIMIT 1
      ) AS lastMessage,
      (
        SELECT createdAt FROM messages 
        WHERE conversationId = c.id 
        ORDER BY createdAt DESC LIMIT 1
      ) AS lastMessageTime
    FROM conversations c
    JOIN conversation_members cm1 ON c.id = cm1.conversationId AND cm1.userId = ?
    JOIN conversation_members cm2 ON c.id = cm2.conversationId AND cm2.userId != ?
    JOIN users u ON cm2.userId = u.id
    ORDER BY COALESCE(lastMessageTime, c.createdAt) DESC
  `;

  db.all(query, [currentUserId, currentUserId], (err, chats) => {
    if (err) {
      console.error('Error fetching chats:', err);
      return res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
    }

    const formattedChats = chats.map((chat) => ({
      id: chat.id,
      contactId: chat.contactId,
      name: chat.name,
      email: chat.email,
      avatar: chat.avatar,
      status: chat.status,
      lastMessage: chat.lastMessage || 'No messages yet. Say hi!',
      time: chat.lastMessageTime
        ? new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'New',
      unreadCount: 0,
      isOnline: true
    }));

    res.json({ chats: formattedChats });
  });
};

// @desc    Create or find direct 1-on-1 chat with target user
// @route   POST /api/chats
export const createOrGetDirectChat = (req, res) => {
  const currentUserId = req.user.id;
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json({ message: 'Recipient user ID is required' });
  }

  if (Number(recipientId) === Number(currentUserId)) {
    return res.status(400).json({ message: 'Cannot create a chat with yourself' });
  }

  // Check if a direct conversation already exists between these 2 users
  const findQuery = `
    SELECT c.id 
    FROM conversations c
    JOIN conversation_members cm1 ON c.id = cm1.conversationId AND cm1.userId = ?
    JOIN conversation_members cm2 ON c.id = cm2.conversationId AND cm2.userId = ?
    WHERE c.type = 'direct'
    LIMIT 1
  `;

  db.get(findQuery, [currentUserId, recipientId], (err, existingChat) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', error: err.message });
    }

    if (existingChat) {
      // Fetch recipient details
      db.get('SELECT id, fullName, email, avatar, status FROM users WHERE id = ?', [recipientId], (uErr, recipient) => {
        return res.json({
          message: 'Existing chat found',
          chat: {
            id: existingChat.id,
            contactId: recipient.id,
            name: recipient.fullName,
            email: recipient.email,
            avatar: recipient.avatar,
            status: recipient.status,
            lastMessage: 'Say hi!',
            time: 'Just now',
            unreadCount: 0,
            isOnline: true
          }
        });
      });
      return;
    }

    // Create new conversation
    db.run("INSERT INTO conversations (type) VALUES ('direct')", function (createErr) {
      if (createErr) {
        return res.status(500).json({ message: 'Failed to create conversation' });
      }

      const newChatId = this.lastID;

      // Add both participants
      const memberStmt = db.prepare('INSERT INTO conversation_members (conversationId, userId) VALUES (?, ?)');
      memberStmt.run(newChatId, currentUserId);
      memberStmt.run(newChatId, recipientId);
      memberStmt.finalize();

      // Return new chat details with recipient info
      db.get('SELECT id, fullName, email, avatar, status FROM users WHERE id = ?', [recipientId], (uErr, recipient) => {
        res.status(201).json({
          message: 'Chat created successfully',
          chat: {
            id: newChatId,
            contactId: recipient.id,
            name: recipient.fullName,
            email: recipient.email,
            avatar: recipient.avatar,
            status: recipient.status,
            lastMessage: 'Conversation started',
            time: 'Just now',
            unreadCount: 0,
            isOnline: true
          }
        });
      });
    });
  });
};
