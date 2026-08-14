import bcrypt from 'bcryptjs';
import db from '../config/db.js';

// @desc    Search users by name or email
// @route   GET /api/users/search?q=query
export const searchUsers = (req, res) => {
  const query = req.query.q || '';
  const currentUserId = Number(req.user.id);

  if (!query.trim()) {
    // Return recommended active users excluding self
    db.all(
      'SELECT id, fullName, email, avatar, status, createdAt FROM users WHERE id != ? LIMIT 10',
      [currentUserId],
      (err, users) => {
        if (err) return res.status(500).json({ message: 'Database query failed' });
        res.json({ users });
      }
    );
    return;
  }

  const searchTerm = `%${query.trim()}%`;
  db.all(
    'SELECT id, fullName, email, avatar, status, createdAt FROM users WHERE id != ? AND (fullName LIKE ? OR email LIKE ?) LIMIT 15',
    [currentUserId, searchTerm, searchTerm],
    (err, users) => {
      if (err) return res.status(500).json({ message: 'Database search error' });
      res.json({ users });
    }
  );
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
