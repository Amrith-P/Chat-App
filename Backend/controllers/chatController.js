import db from '../config/db.js';
import { isUserOnline } from '../socket/socketHandler.js';
import { areUsersFriends } from '../middleware/friendshipMiddleware.js';

// @desc    Get all conversations (direct + group) for the logged in user
// @route   GET /api/chats
export const getUserChats = (req, res) => {
  const currentUserId = req.user.id;

  const query = `
    SELECT 
      c.id,
      c.type,
      c.name AS groupName,
      c.description AS groupDesc,
      c.avatar AS groupAvatar,
      c.adminId,
      c.createdAt,
      (SELECT COUNT(*) FROM conversation_members WHERE conversationId = c.id) AS memberCount,
      u.id AS contactid,
      u.fullName AS contactName,
      u.email AS contactEmail,
      u.avatar AS contactAvatar,
      u.status AS contactStatus,
      u.publicKey AS publickey,
      m.content AS lastmessage,
      m.senderId AS lastSenderId,
      su.fullName AS lastSenderName,
      m.isDeleted AS isdeleted,
      m.createdAt AS lastmsgtime,
      fc.id AS isfavorite
    FROM conversations c
    JOIN conversation_members cm1 ON c.id = cm1.conversationId AND cm1.userId = ?
    LEFT JOIN conversation_members cm2 ON c.id = cm2.conversationId AND cm2.userId != ? AND c.type = 'direct'
    LEFT JOIN users u ON cm2.userId = u.id AND c.type = 'direct'
    LEFT JOIN favorite_chats fc ON c.id = fc.conversationId AND fc.userId = ?
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages 
      WHERE conversationId = c.id 
        AND id NOT IN (SELECT messageId FROM deleted_messages_for_user WHERE userId = ?)
      ORDER BY id DESC LIMIT 1
    )
    LEFT JOIN users su ON m.senderId = su.id
    ORDER BY COALESCE(m.createdAt, c.createdAt) DESC
  `;

  db.all(query, [currentUserId, currentUserId, currentUserId, currentUserId], (err, chats) => {
    if (err) {
      console.error('Error fetching chats:', err);
      return res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
    }

    const formattedChats = (chats || []).map((chat) => {
      const isGroup = chat.type === 'group';
      const cId = isGroup ? null : (chat.contactId ?? chat.contactid);
      const rawLastMsg = chat.lastMessage ?? chat.lastmessage;
      const isDeletedGlobally = Boolean(chat.isDeleted || chat.isdeleted);
      const senderName = chat.lastSenderName ? chat.lastSenderName.split(' ')[0] : '';
      
      let displayLastMsg = isGroup ? 'No messages yet. Say hi to everyone!' : 'No messages yet. Say hi!';
      if (rawLastMsg !== undefined && rawLastMsg !== null && rawLastMsg !== '') {
        if (isDeletedGlobally) {
          displayLastMsg = '🚫 This message was deleted';
        } else {
          displayLastMsg = (isGroup && senderName) ? `${senderName}: ${rawLastMsg}` : rawLastMsg;
        }
      } else if (isDeletedGlobally) {
        displayLastMsg = '🚫 This message was deleted';
      }

      const resolvedContactName = chat.contactName || chat.contactname;
      const resolvedGroupName = chat.groupName || chat.groupname;
      const resolvedContactEmail = chat.contactEmail || chat.contactemail || '';
      const resolvedContactAvatar = chat.contactAvatar || chat.contactavatar;
      const resolvedGroupAvatar = chat.groupAvatar || chat.groupavatar;
      const resolvedContactStatus = chat.contactStatus || chat.contactstatus || '';
      const resolvedGroupDesc = chat.groupDesc || chat.groupdesc || '';

      const chatName = isGroup 
        ? (resolvedGroupName || 'Group Chat') 
        : (resolvedContactName || 'User');

      const chatAvatar = isGroup
        ? (resolvedGroupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}`)
        : (resolvedContactAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(chatName)}`);

      return {
        id: chat.id,
        chatId: chat.id,
        contactId: cId,
        name: chatName,
        email: isGroup ? '' : resolvedContactEmail,
        avatar: chatAvatar,
        status: isGroup ? (resolvedGroupDesc || `${chat.memberCount || 1} members`) : resolvedContactStatus,
        description: resolvedGroupDesc,
        type: chat.type || (isGroup ? 'group' : 'direct'),
        isGroup,
        adminId: chat.adminId || chat.adminid,
        memberCount: chat.memberCount || chat.membercount || 1,
        lastMessage: displayLastMsg,
        lastMessageTime: chat.lastMessageTime ?? chat.lastmsgtime ?? chat.createdAt ?? null,
        time: chat.lastMessageTime ?? chat.lastmsgtime ? new Date(chat.lastMessageTime ?? chat.lastmsgtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New',
        unreadCount: 0,
        isOnline: isGroup ? false : isUserOnline(cId),
        isFavorite: Boolean(chat.isFavorite || chat.isfavorite),
        publicKey: isGroup ? null : (chat.publicKey || chat.publickey)
      };
    });

    res.json({ chats: formattedChats });
  });
};

// @desc    Create or find direct 1-on-1 chat with target user
// @route   POST /api/chats
export const createOrGetDirectChat = async (req, res) => {
  const currentUserId = req.user.id;
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json({ message: 'Recipient user ID is required' });
  }

  if (Number(recipientId) === Number(currentUserId)) {
    return res.status(400).json({ message: 'Cannot create a chat with yourself' });
  }

  // Enforce Friendship check
  const isFriends = await areUsersFriends(currentUserId, recipientId);
  if (!isFriends) {
    return res.status(403).json({
      message: 'Forbidden: You can only start private chats with confirmed friends',
      code: 'FRIENDSHIP_REQUIRED'
    });
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

// @desc    Delete conversation and messages
// @route   DELETE /api/chats/:chatId
export const deleteChat = (req, res) => {
  const chatId = req.params.chatId || req.params.id;
  const currentUserId = req.user?.id;

  if (!chatId) {
    return res.status(400).json({ message: 'Chat ID is required' });
  }

  // Delete messages, conversation members, favorite records, and the conversation directly
  db.run('DELETE FROM messages WHERE conversationid = ? OR conversationId = ?', [chatId, chatId], () => {
    db.run('DELETE FROM conversation_members WHERE conversationid = ? OR conversationId = ?', [chatId, chatId], () => {
      db.run('DELETE FROM favorite_chats WHERE conversationid = ? OR conversationId = ?', [chatId, chatId], () => {
        db.run('DELETE FROM conversations WHERE id = ?', [chatId], (delErr) => {
          if (delErr) {
            console.error('Failed to delete chat:', delErr.message);
            return res.status(500).json({ message: 'Failed to delete chat', error: delErr.message });
          }
          res.json({ success: true, message: 'Chat deleted successfully', chatId });
        });
      });
    });
  });
};

// @desc    Clear all message history in a conversation without deleting the chat
// @route   DELETE /api/chats/:chatId/messages
export const clearChatMessages = (req, res) => {
  const chatId = req.params.chatId || req.params.id;

  if (!chatId) {
    return res.status(400).json({ message: 'Chat ID is required' });
  }

  db.run('DELETE FROM messages WHERE conversationid = ? OR conversationId = ?', [chatId, chatId], (err) => {
    if (err) {
      console.error('Failed to clear chat messages:', err.message);
      return res.status(500).json({ message: 'Failed to clear chat messages', error: err.message });
    }
    res.json({ success: true, message: 'Chat messages cleared successfully', chatId });
  });
};

// @desc    Toggle favorite/starred status of a chat
// @route   POST /api/chats/:chatId/favorite
export const toggleFavoriteChat = (req, res) => {
  const chatId = req.params.chatId || req.params.id;
  const currentUserId = req.user?.id;

  if (!chatId || !currentUserId) {
    return res.status(400).json({ message: 'Chat ID and User ID are required' });
  }

  db.get(
    'SELECT id FROM favorite_chats WHERE userId = ? AND (conversationId = ? OR conversationid = ?)',
    [currentUserId, chatId, chatId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ message: 'Database query error', error: err.message });
      }

      if (existing) {
        db.run('DELETE FROM favorite_chats WHERE id = ?', [existing.id], (delErr) => {
          if (delErr) {
            return res.status(500).json({ message: 'Failed to remove favorite', error: delErr.message });
          }
          res.json({ success: true, isFavorite: false, chatId });
        });
      } else {
        db.run(
          'INSERT INTO favorite_chats (userId, conversationId) VALUES (?, ?)',
          [currentUserId, chatId],
          (insErr) => {
            if (insErr) {
              return res.status(500).json({ message: 'Failed to add favorite', error: insErr.message });
            }
            res.json({ success: true, isFavorite: true, chatId });
          }
        );
      }
    }
  );
};
