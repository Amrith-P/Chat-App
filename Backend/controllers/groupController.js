import db from '../config/db.js';
import { isUserOnline } from '../socket/socketHandler.js';

// @desc    Create a new Group Conversation
// @route   POST /api/groups
export const createGroup = (req, res) => {
  const currentUserId = req.user.id;
  const { name, description = '', avatar = '', memberIds = [] } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Group name is required' });
  }

  const trimmedName = name.trim().slice(0, 100);
  const trimmedDesc = (description || '').trim().slice(0, 500);
  const selectedAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(trimmedName)}`;

  // Deduplicate member IDs and ensure current user is included
  const allMemberIds = Array.from(new Set([currentUserId, ...memberIds.map(Number)])).filter(Boolean);

  if (allMemberIds.length < 2) {
    return res.status(400).json({ message: 'At least one additional member must be selected' });
  }

  db.serialize(() => {
    // 1. Create conversation entry
    db.run(
      "INSERT INTO conversations (type, name, description, avatar, adminId) VALUES ('group', ?, ?, ?, ?)",
      [trimmedName, trimmedDesc, selectedAvatar, currentUserId],
      function (cErr) {
        if (cErr) {
          return res.status(500).json({ message: 'Failed to create group conversation', error: cErr.message });
        }

        const groupId = this.lastID;

        // 2. Also insert into groups table
        db.run(
          'INSERT INTO groups (id, name, description, avatar, created_by) VALUES (?, ?, ?, ?, ?)',
          [groupId, trimmedName, trimmedDesc, selectedAvatar, currentUserId],
          () => {}
        );

        // 3. Add all members with roles
        const placeholders = allMemberIds.map(() => '(?, ?, ?)').join(',');
        const values = [];
        allMemberIds.forEach((mId) => {
          const role = String(mId) === String(currentUserId) ? 'admin' : 'member';
          values.push(groupId, mId, role);
        });

        db.run(
          `INSERT INTO conversation_members (conversationId, userId, role) VALUES ${placeholders}`,
          values,
          (mErr) => {
            if (mErr) {
              return res.status(500).json({ message: 'Failed to add members to group', error: mErr.message });
            }

            // Also mirror to group_members table
            const gmPlaceholders = allMemberIds.map(() => '(?, ?, ?)').join(',');
            db.run(`INSERT INTO group_members (group_id, user_id, role) VALUES ${gmPlaceholders} ON CONFLICT DO NOTHING`, values, () => {});

            // Fetch created group response with member count
            return res.status(201).json({
              success: true,
              message: 'Group created successfully',
              group: {
                id: groupId,
                chatId: groupId,
                name: trimmedName,
                description: trimmedDesc,
                avatar: selectedAvatar,
                type: 'group',
                isGroup: true,
                adminId: currentUserId,
                memberCount: allMemberIds.length,
                lastMessage: `${req.user.fullName} created group "${trimmedName}"`,
                time: 'Just now',
                unreadCount: 0,
                isFavorite: false
              }
            });
          }
        );
      }
    );
  });
};

// @desc    Get all groups for current user
// @route   GET /api/groups
export const getUserGroups = (req, res) => {
  const currentUserId = req.user.id;

  const query = `
    SELECT 
      c.id,
      c.type,
      c.name,
      c.description,
      c.avatar,
      c.adminId,
      c.createdAt,
      (SELECT COUNT(*) FROM conversation_members WHERE conversationId = c.id) AS memberCount,
      m.content AS lastMessage,
      m.senderId AS lastSenderId,
      u.fullName AS lastSenderName,
      m.isDeleted,
      m.createdAt AS lastMsgTime,
      fc.id AS isFavorite
    FROM conversations c
    JOIN conversation_members cm ON c.id = cm.conversationId AND cm.userId = ?
    LEFT JOIN favorite_chats fc ON c.id = fc.conversationId AND fc.userId = ?
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages 
      WHERE conversationid = c.id 
        AND id NOT IN (SELECT messageId FROM deleted_messages_for_user WHERE userId = ?)
      ORDER BY id DESC LIMIT 1
    )
    LEFT JOIN users u ON m.senderId = u.id
    WHERE c.type = 'group'
    ORDER BY COALESCE(m.createdAt, c.createdAt) DESC
  `;

  db.all(query, [currentUserId, currentUserId, currentUserId], (err, groups) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch groups', error: err.message });
    }

    const formattedGroups = (groups || []).map((g) => {
      const isDeletedGlobally = Boolean(g.isDeleted);
      let displayLastMsg = 'No messages yet. Say hi to everyone!';
      if (g.lastMessage) {
        displayLastMsg = isDeletedGlobally 
          ? '🚫 This message was deleted' 
          : (g.lastSenderName ? `${g.lastSenderName.split(' ')[0]}: ${g.lastMessage}` : g.lastMessage);
      }

      return {
        id: g.id,
        chatId: g.id,
        name: g.name || 'Group Chat',
        description: g.description || '',
        avatar: g.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${g.id}`,
        type: 'group',
        isGroup: true,
        adminId: g.adminId,
        memberCount: g.memberCount || 1,
        lastMessage: displayLastMsg,
        lastMessageTime: g.lastMsgTime || g.createdAt,
        time: g.lastMsgTime ? new Date(g.lastMsgTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New',
        unreadCount: 0,
        isFavorite: Boolean(g.isFavorite)
      };
    });

    res.json({ groups: formattedGroups });
  });
};

// @desc    Get Group Details & Members
// @route   GET /api/groups/:groupId
export const getGroupDetails = (req, res) => {
  const groupId = req.params.groupId || req.params.id;

  const groupQuery = `
    SELECT id, name, description, avatar, adminId, type, createdAt 
    FROM conversations 
    WHERE id = ? AND type = 'group'
  `;

  db.get(groupQuery, [groupId], (err, group) => {
    if (err || !group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const membersQuery = `
      SELECT u.id, u.fullName, u.email, u.avatar, u.status, cm.role, cm.joinedAt
      FROM conversation_members cm
      JOIN users u ON cm.userId = u.id
      WHERE cm.conversationId = ?
      ORDER BY CASE WHEN cm.role = 'admin' THEN 1 ELSE 2 END, u.fullName ASC
    `;

    db.all(membersQuery, [groupId], (mErr, members) => {
      if (mErr) {
        return res.status(500).json({ message: 'Failed to fetch members', error: mErr.message });
      }

      const formattedMembers = (members || []).map((m) => ({
        id: m.id,
        fullName: m.fullName,
        name: m.fullName,
        email: m.email,
        avatar: m.avatar,
        status: m.status,
        role: m.role || (String(m.id) === String(group.adminId) ? 'admin' : 'member'),
        isOnline: isUserOnline(m.id),
        joinedAt: m.joinedAt
      }));

      res.json({
        group: {
          id: group.id,
          name: group.name,
          description: group.description || '',
          avatar: group.avatar,
          adminId: group.adminId,
          type: 'group',
          isGroup: true,
          memberCount: formattedMembers.length,
          members: formattedMembers
        }
      });
    });
  });
};

// @desc    Get Group Members
// @route   GET /api/groups/:groupId/members
export const getGroupMembers = (req, res) => {
  const groupId = req.params.groupId;

  const query = `
    SELECT u.id, u.fullName, u.email, u.avatar, u.status, cm.role, cm.joinedAt, c.adminId
    FROM conversation_members cm
    JOIN users u ON cm.userId = u.id
    JOIN conversations c ON cm.conversationId = c.id
    WHERE cm.conversationId = ?
    ORDER BY CASE WHEN cm.role = 'admin' THEN 1 ELSE 2 END, u.fullName ASC
  `;

  db.all(query, [groupId], (err, members) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch group members', error: err.message });
    }

    const formatted = (members || []).map((m) => ({
      id: m.id,
      fullName: m.fullName,
      name: m.fullName,
      email: m.email,
      avatar: m.avatar,
      status: m.status,
      role: m.role || (String(m.id) === String(m.adminId) ? 'admin' : 'member'),
      isOnline: isUserOnline(m.id)
    }));

    res.json({ members: formatted });
  });
};

// @desc    Add member(s) to group
// @route   POST /api/groups/:groupId/members
export const addGroupMembers = (req, res) => {
  const groupId = req.params.groupId;
  const { memberIds = [] } = req.body;

  if (!memberIds || memberIds.length === 0) {
    return res.status(400).json({ message: 'At least one member ID is required to add' });
  }

  const idsToAdd = Array.from(new Set(memberIds.map(Number))).filter(Boolean);

  const placeholders = idsToAdd.map(() => '(?, ?, ?)').join(',');
  const values = [];
  idsToAdd.forEach((mId) => {
    values.push(groupId, mId, 'member');
  });

  db.run(
    `INSERT INTO conversation_members (conversationId, userId, role) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
    values,
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to add group members', error: err.message });
      }

      db.run(`INSERT INTO group_members (group_id, user_id, role) VALUES ${placeholders} ON CONFLICT DO NOTHING`, values, () => {});

      // Return updated member list
      getGroupMembers(req, res);
    }
  );
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:userId
export const removeGroupMember = (req, res) => {
  const groupId = req.params.groupId;
  const targetUserId = req.params.userId;

  if (!groupId || !targetUserId) {
    return res.status(400).json({ message: 'Group ID and User ID are required' });
  }

  db.run('DELETE FROM conversation_members WHERE conversationId = ? AND userId = ?', [groupId, targetUserId], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to remove member', error: err.message });
    }

    db.run('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, targetUserId], () => {});

    res.json({ success: true, message: 'Member removed successfully', groupId, removedUserId: targetUserId });
  });
};

// @desc    Update member role (promote/demote admin)
// @route   PATCH /api/groups/:groupId/members/:userId/role
export const updateMemberRole = (req, res) => {
  const groupId = req.params.groupId;
  const targetUserId = req.params.userId;
  const { role } = req.body;

  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ message: 'Role must be either admin or member' });
  }

  db.run('UPDATE conversation_members SET role = ? WHERE conversationId = ? AND userId = ?', [role, groupId, targetUserId], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to update member role', error: err.message });
    }

    db.run('UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?', [role, groupId, targetUserId], () => {});

    res.json({ success: true, message: `Role updated to ${role}`, groupId, targetUserId, role });
  });
};

// @desc    Update group settings (name, description, avatar)
// @route   PATCH /api/groups/:groupId
export const updateGroupSettings = (req, res) => {
  const groupId = req.params.groupId;
  const { name, description, avatar } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Group name is required' });
  }

  const trimmedName = name.trim().slice(0, 100);
  const trimmedDesc = (description || '').trim().slice(0, 500);

  db.run(
    'UPDATE conversations SET name = ?, description = ?, avatar = COALESCE(?, avatar) WHERE id = ? AND type = "group"',
    [trimmedName, trimmedDesc, avatar || null, groupId],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to update group settings', error: err.message });
      }

      db.run('UPDATE groups SET name = ?, description = ?, avatar = COALESCE(?, avatar) WHERE id = ?', [trimmedName, trimmedDesc, avatar || null, groupId], () => {});

      res.json({
        success: true,
        message: 'Group settings updated successfully',
        group: { id: groupId, name: trimmedName, description: trimmedDesc, avatar }
      });
    }
  );
};

// @desc    Leave group
// @route   POST /api/groups/:groupId/leave
export const leaveGroup = (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  db.run('DELETE FROM conversation_members WHERE conversationId = ? AND userId = ?', [groupId, userId], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to leave group', error: err.message });
    }

    db.run('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId], () => {});

    res.json({ success: true, message: 'You have left the group', groupId, userId });
  });
};

// @desc    Delete group (Admin/Owner only)
// @route   DELETE /api/groups/:groupId
export const deleteGroup = (req, res) => {
  const groupId = req.params.groupId;

  db.serialize(() => {
    db.run('DELETE FROM messages WHERE conversationId = ?', [groupId], () => {});
    db.run('DELETE FROM conversation_members WHERE conversationId = ?', [groupId], () => {});
    db.run('DELETE FROM group_members WHERE group_id = ?', [groupId], () => {});
    db.run('DELETE FROM groups WHERE id = ?', [groupId], () => {});
    db.run('DELETE FROM conversations WHERE id = ?', [groupId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete group', error: err.message });
      }
      res.json({ success: true, message: 'Group deleted successfully', groupId });
    });
  });
};
