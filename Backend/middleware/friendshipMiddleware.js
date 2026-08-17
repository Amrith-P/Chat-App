import db from '../config/db.js';

// Helper function to check if two users are confirmed friends in DB
export const areUsersFriends = (userA, userB) => {
  return new Promise((resolve) => {
    if (!userA || !userB) return resolve(false);

    const u1 = Math.min(Number(userA), Number(userB));
    const u2 = Math.max(Number(userA), Number(userB));

    const query = `
      SELECT id FROM friendships 
      WHERE (user_one_id = ? AND user_two_id = ?) 
         OR (user_one_id = ? AND user_two_id = ?)
      LIMIT 1
    `;

    db.get(query, [u1, u2, u2, u1], (err, row) => {
      if (err || !row) return resolve(false);
      return resolve(true);
    });
  });
};

// Express Middleware to enforce friendship requirement
export const requireFriendship = async (req, res, next) => {
  const currentUserId = req.user.id;
  const recipientId = req.body.recipientId || req.body.contactId || req.params.recipientId || req.params.userId;

  if (!recipientId) {
    return res.status(400).json({ message: 'Target user ID is required' });
  }

  if (Number(recipientId) === Number(currentUserId)) {
    return res.status(400).json({ message: 'Cannot establish friendship with yourself' });
  }

  const isFriends = await areUsersFriends(currentUserId, recipientId);

  if (!isFriends) {
    return res.status(403).json({ 
      message: 'Forbidden: You can only communicate with users who are your confirmed friends',
      code: 'FRIENDSHIP_REQUIRED'
    });
  }

  next();
};
