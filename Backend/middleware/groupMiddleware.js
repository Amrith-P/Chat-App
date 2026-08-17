import db from '../config/db.js';

// Verify user is a member of the target group/conversation
export const requireGroupMember = (req, res, next) => {
  const groupId = req.params.groupId || req.params.chatId || req.body.groupId;
  const userId = req.user.id;

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required' });
  }

  const query = `
    SELECT cm.role, c.type, c.adminId
    FROM conversation_members cm
    JOIN conversations c ON c.id = cm.conversationId
    WHERE cm.conversationId = ? AND cm.userId = ?
  `;

  db.get(query, [groupId, userId], (err, member) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', error: err.message });
    }
    if (!member) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    req.groupMember = member;
    next();
  });
};

// Verify user has admin privileges in the target group
export const requireGroupAdmin = (req, res, next) => {
  const groupId = req.params.groupId || req.params.chatId || req.body.groupId;
  const userId = req.user.id;

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required' });
  }

  const query = `
    SELECT cm.role, c.adminId
    FROM conversation_members cm
    JOIN conversations c ON c.id = cm.conversationId
    WHERE cm.conversationId = ? AND cm.userId = ?
  `;

  db.get(query, [groupId, userId], (err, member) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', error: err.message });
    }

    if (!member) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    const isAdmin = member.role === 'admin' || member.role === 'owner' || String(member.adminId) === String(userId);

    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin permissions required' });
    }

    req.groupMember = member;
    next();
  });
};

// Verify user is group owner/creator
export const requireGroupOwner = (req, res, next) => {
  const groupId = req.params.groupId || req.params.chatId || req.body.groupId;
  const userId = req.user.id;

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required' });
  }

  db.get('SELECT adminId FROM conversations WHERE id = ?', [groupId], (err, conv) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', error: err.message });
    }
    if (!conv) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (String(conv.adminId) !== String(userId)) {
      return res.status(403).json({ message: 'Forbidden: Only the group owner can perform this action' });
    }

    next();
  });
};
