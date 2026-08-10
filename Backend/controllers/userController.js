import db from '../config/db.js';

// @desc    Search users by name or email
// @route   GET /api/users/search?q=query
export const searchUsers = (req, res) => {
  const query = req.query.q || '';
  const currentUserId = req.user.id;

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
