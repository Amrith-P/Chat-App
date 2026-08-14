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
      u.id AS "contactId",
      u.fullName AS name,
      u.email AS email,
      u.avatar AS avatar,
      u.status AS status,
      m.content AS "lastMessage",
      m.createdAt AS "lastMessageTime"
    FROM conversations c
    JOIN conversation_members cm1 ON c.id = cm1.conversationId AND cm1.userId = ?
    JOIN conversation_members cm2 ON c.id = cm2.conversationId AND cm2.userId != ?
    JOIN users u ON cm2.userId = u.id
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages 
      WHERE conversationId = c.id 
      ORDER BY id DESC LIMIT 1
    )
    ORDER BY c.id DESC
  `;

  db.all(query, [currentUserId, currentUserId], (err, chats) => {
    if (err) {
      console.error('Error fetching chats:', err);
      return res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
    }

    const formattedChats = (chats || []).map((chat) => ({
      id: chat.id,
      contactId: chat.contactId,
      name: chat.name,
      email: chat.email,
      avatar: chat.avatar,
      status: chat.status,
      lastMessage: chat.lastMessage || 'No messages yet. Say hi!',
      lastMessageTime: chat.lastMessageTime || null,
      time: chat.lastMessageTime || 'New',
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
            contactId: recipient ? recipient.id : recipientId,
            name: recipient ? recipient.fullName : 'User',
            email: recipient ? recipient.email : '',
            avatar: recipient ? recipient.avatar : '',
            status: recipient ? recipient.status : '',
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
        return res.status(500).json({ message: 'Failed to create conversation', error: createErr.message });
      }

      const newChatId = this.lastID;

      // Add both participants using unified db.run
      db.run('INSERT INTO conversation_members (conversationId, userId) VALUES (?, ?)', [newChatId, currentUserId], (m1Err) => {
        db.run('INSERT INTO conversation_members (conversationId, userId) VALUES (?, ?)', [newChatId, recipientId], (m2Err) => {
          // Return new chat details with recipient info
          db.get('SELECT id, fullName, email, avatar, status FROM users WHERE id = ?', [recipientId], (uErr, recipient) => {
            res.status(201).json({
              message: 'Chat created successfully',
              chat: {
                id: newChatId,
                contactId: recipient ? recipient.id : recipientId,
                name: recipient ? recipient.fullName : 'User',
                email: recipient ? recipient.email : '',
                avatar: recipient ? recipient.avatar : '',
                status: recipient ? recipient.status : '',
                lastMessage: 'Conversation started',
                time: 'Just now',
                unreadCount: 0,
                isOnline: true
              }
            });
          });
        });
      });
    });
  });
};
