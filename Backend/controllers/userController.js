import bcrypt from 'bcryptjs';
import db from '../config/db.js';

// @desc    Search users by name or email with relationship status
// @route   GET /api/users/search?q=query
export const searchUsers = (req, res) => {
  const query = (req.query.q || '').trim();
  const currentUserId = Number(req.user.id);

  const baseSelect = `
    SELECT u.id, u.fullName, u.email, u.avatar, u.status, u.createdAt,
      CASE 
        WHEN f.id IS NOT NULL THEN 'friend'
        WHEN fr_out.id IS NOT NULL THEN 'request_sent'
        WHEN fr_inc.id IS NOT NULL THEN 'request_received'
        ELSE 'none'
      END as relationship,
      fr_inc.id as incomingRequestId,
      fr_out.id as outgoingRequestId
    FROM users u
    LEFT JOIN friendships f ON (
      (f.user_one_id = LEAST(?, u.id) AND f.user_two_id = GREATEST(?, u.id)) OR
      (f.user_one_id = ? AND f.user_two_id = u.id) OR
      (f.user_one_id = u.id AND f.user_two_id = ?)
    )
    LEFT JOIN friend_requests fr_out ON (fr_out.sender_id = ? AND fr_out.receiver_id = u.id AND fr_out.status = 'pending')
    LEFT JOIN friend_requests fr_inc ON (fr_inc.sender_id = u.id AND fr_inc.receiver_id = ? AND fr_inc.status = 'pending')
    WHERE u.id != ?
  `;

  if (!query) {
    const sql = `${baseSelect} LIMIT 15`;
    const params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId];
    db.all(sql, params, (err, users) => {
      if (err) {
        // SQLite LEAST/GREATEST fallback if standard SQL syntax differs
        const fallbackSql = `
          SELECT u.id, u.fullName, u.email, u.avatar, u.status, u.createdAt,
            CASE 
              WHEN f.id IS NOT NULL THEN 'friend'
              WHEN fr_out.id IS NOT NULL THEN 'request_sent'
              WHEN fr_inc.id IS NOT NULL THEN 'request_received'
              ELSE 'none'
            END as relationship,
            fr_inc.id as incomingRequestId,
            fr_out.id as outgoingRequestId
          FROM users u
          LEFT JOIN friendships f ON (
            (f.user_one_id = ? AND f.user_two_id = u.id) OR (f.user_one_id = u.id AND f.user_two_id = ?)
          )
          LEFT JOIN friend_requests fr_out ON (fr_out.sender_id = ? AND fr_out.receiver_id = u.id AND fr_out.status = 'pending')
          LEFT JOIN friend_requests fr_inc ON (fr_inc.sender_id = u.id AND fr_inc.receiver_id = ? AND fr_inc.status = 'pending')
          WHERE u.id != ?
          LIMIT 15
        `;
        db.all(fallbackSql, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId], (fErr, fUsers) => {
          if (fErr) return res.status(500).json({ message: 'Database query failed' });
          res.json({ users: fUsers || [] });
        });
        return;
      }
      res.json({ users: users || [] });
    });
    return;
  }

  const searchTerm = `%${query}%`;
  const sql = `${baseSelect} AND (u.fullName LIKE ? OR u.email LIKE ?) LIMIT 20`;
  const params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, searchTerm, searchTerm];
  
  db.all(sql, params, (err, users) => {
    if (err) {
      const fallbackSql = `
        SELECT u.id, u.fullName, u.email, u.avatar, u.status, u.createdAt,
          CASE 
            WHEN f.id IS NOT NULL THEN 'friend'
            WHEN fr_out.id IS NOT NULL THEN 'request_sent'
            WHEN fr_inc.id IS NOT NULL THEN 'request_received'
            ELSE 'none'
          END as relationship,
          fr_inc.id as incomingRequestId,
          fr_out.id as outgoingRequestId
        FROM users u
        LEFT JOIN friendships f ON (
          (f.user_one_id = ? AND f.user_two_id = u.id) OR (f.user_one_id = u.id AND f.user_two_id = ?)
        )
        LEFT JOIN friend_requests fr_out ON (fr_out.sender_id = ? AND fr_out.receiver_id = u.id AND fr_out.status = 'pending')
        LEFT JOIN friend_requests fr_inc ON (fr_inc.sender_id = u.id AND fr_inc.receiver_id = ? AND fr_inc.status = 'pending')
        WHERE u.id != ? AND (u.fullName LIKE ? OR u.email LIKE ?)
        LIMIT 20
      `;
      db.all(fallbackSql, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, searchTerm, searchTerm], (fErr, fUsers) => {
        if (fErr) return res.status(500).json({ message: 'Database search error' });
        res.json({ users: fUsers || [] });
      });
      return;
    }
    res.json({ users: users || [] });
  });
};

// @desc    Get detailed user profile by ID
// @route   GET /api/users/:id
export const getUserById = (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT id, fullName, email, avatar, status, createdAt FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ user });
    }
  );
};

// @desc    Update current authenticated user's profile
// @route   PUT /api/users/profile
export const updateProfile = (req, res) => {
  const userId = req.user.id;
  const { fullName, status, avatar } = req.body;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedName = fullName !== undefined ? fullName.trim() : user.fullName;
    const updatedStatus = status !== undefined ? status.trim() : user.status;
    const updatedAvatar = avatar !== undefined ? avatar.trim() : user.avatar;

    db.run(
      'UPDATE users SET fullName = ?, status = ?, avatar = ? WHERE id = ?',
      [updatedName, updatedStatus, updatedAvatar, userId],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: 'Failed to update profile' });
        }

        res.json({
          message: 'Profile updated successfully',
          user: {
            id: userId,
            fullName: updatedName,
            email: user.email,
            avatar: updatedAvatar,
            status: updatedStatus
          }
        });
      }
    );
  });
};

// @desc    Change current authenticated user's password
// @route   PUT /api/users/change-password
export const changePassword = (req, res, next) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    try {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password does not match' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: 'Failed to update password' });
          }

          res.json({ message: 'Password updated successfully' });
        }
      );
    } catch (error) {
      next(error);
    }
  });
};
