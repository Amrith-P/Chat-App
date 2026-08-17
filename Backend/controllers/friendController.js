import db from '../config/db.js';
import { getIO } from '../socket/socketHandler.js';
import { areUsersFriends } from '../middleware/friendshipMiddleware.js';

// Send Friend Request
export const sendFriendRequest = async (req, res) => {
  const senderId = req.user.id;
  const receiverId = Number(req.body.receiverId);

  if (!receiverId || isNaN(receiverId)) {
    return res.status(400).json({ message: 'Valid receiverId is required' });
  }

  if (senderId === receiverId) {
    return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
  }

  try {
    // Check if recipient exists
    db.get(`SELECT id, fullName, email, avatar FROM users WHERE id = ?`, [receiverId], async (err, receiverUser) => {
      if (err || !receiverUser) {
        return res.status(444).json({ message: 'User not found' });
      }

      // Check if already friends
      const alreadyFriends = await areUsersFriends(senderId, receiverId);
      if (alreadyFriends) {
        return res.status(400).json({ message: 'You are already friends with this user' });
      }

      // Check if reverse request is pending (User B already sent request to User A)
      db.get(
        `SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`,
        [receiverId, senderId],
        (revErr, revReq) => {
          if (revReq) {
            // Reverse request exists -> Auto accept!
            const u1 = Math.min(senderId, receiverId);
            const u2 = Math.max(senderId, receiverId);

            db.run(
              `UPDATE friend_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [revReq.id],
              (upErr) => {
                if (upErr) return res.status(500).json({ message: 'Failed to accept friend request' });

                db.run(
                  `INSERT INTO friendships (user_one_id, user_two_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
                  [u1, u2],
                  (fErr) => {
                    if (fErr) return res.status(500).json({ message: 'Failed to record friendship' });

                    // Emit real-time friendship created event to both users
                    try {
                      const io = getIO();
                      io.to(`user_${senderId}`).to(`user_${receiverId}`).emit('friendship_created', {
                        userOneId: senderId,
                        userTwoId: receiverId
                      });
                    } catch (e) {}

                    return res.status(200).json({
                      message: 'Friend request accepted! You are now friends.',
                      status: 'accepted'
                    });
                  }
                );
              }
            );
            return;
          }

          // Check if request already pending from sender to receiver
          db.get(
            `SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ?`,
            [senderId, receiverId],
            (existErr, existReq) => {
              if (existReq && existReq.status === 'pending') {
                return res.status(400).json({ message: 'Friend request is already pending' });
              }

              if (existReq) {
                // Re-open previous rejected/cancelled request to pending
                db.run(
                  `UPDATE friend_requests SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                  [existReq.id],
                  function (upErr) {
                    if (upErr) return res.status(500).json({ message: 'Failed to send friend request' });

                    emitSocketRequestNotification(existReq.id, senderId, receiverId, req.user);
                    return res.status(201).json({
                      message: 'Friend request sent successfully',
                      requestId: existReq.id,
                      status: 'pending'
                    });
                  }
                );
              } else {
                // Create new request
                db.run(
                  `INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')`,
                  [senderId, receiverId],
                  function (insErr) {
                    if (insErr) return res.status(500).json({ message: 'Failed to send friend request' });

                    const newReqId = this.lastID;
                    emitSocketRequestNotification(newReqId, senderId, receiverId, req.user);

                    return res.status(201).json({
                      message: 'Friend request sent successfully',
                      requestId: newReqId,
                      status: 'pending'
                    });
                  }
                );
              }
            }
          );
        }
      );
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error sending friend request' });
  }
};

const emitSocketRequestNotification = (requestId, senderId, receiverId, senderUser) => {
  try {
    const io = getIO();
    io.to(`user_${receiverId}`).emit('friend_request_received', {
      requestId,
      sender: {
        id: senderUser.id,
        name: senderUser.fullName || senderUser.name,
        email: senderUser.email,
        avatar: senderUser.avatar
      }
    });
  } catch (e) {}
};

// Get Incoming & Outgoing Friend Requests
export const getFriendRequests = (req, res) => {
  const userId = req.user.id;

  const incomingQuery = `
    SELECT fr.id, fr.sender_id as "senderId", fr.status, fr.created_at as "createdAt",
           u.fullName, u.email, u.avatar, u.status as "bio"
    FROM friend_requests fr
    JOIN users u ON fr.sender_id = u.id
    WHERE fr.receiver_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `;

  const outgoingQuery = `
    SELECT fr.id, fr.receiver_id as "receiverId", fr.status, fr.created_at as "createdAt",
           u.fullName, u.email, u.avatar, u.status as "bio"
    FROM friend_requests fr
    JOIN users u ON fr.receiver_id = u.id
    WHERE fr.sender_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `;

  db.all(incomingQuery, [userId], (incErr, incoming) => {
    if (incErr) return res.status(500).json({ message: 'Error fetching incoming requests' });

    db.all(outgoingQuery, [userId], (outErr, outgoing) => {
      if (outErr) return res.status(500).json({ message: 'Error fetching outgoing requests' });

      return res.status(200).json({
        incoming: incoming || [],
        outgoing: outgoing || []
      });
    });
  });
};

// Get Pending Incoming Count (for sidebar notification badge)
export const getFriendRequestCount = (req, res) => {
  const userId = req.user.id;

  const query = `SELECT COUNT(*) as count FROM friend_requests WHERE receiver_id = ? AND status = 'pending'`;

  db.get(query, [userId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Error fetching request count' });
    return res.status(200).json({ incomingCount: row ? row.count : 0 });
  });
};

// Accept Friend Request
export const acceptFriendRequest = (req, res) => {
  const userId = req.user.id;
  const requestId = Number(req.params.id);

  db.get(`SELECT * FROM friend_requests WHERE id = ?`, [requestId], (err, freq) => {
    if (err || !freq) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (Number(freq.receiver_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Not authorized to accept this friend request' });
    }

    if (freq.status !== 'pending') {
      return res.status(400).json({ message: `Friend request is already ${freq.status}` });
    }

    const senderId = freq.sender_id;
    const receiverId = freq.receiver_id;
    const u1 = Math.min(senderId, receiverId);
    const u2 = Math.max(senderId, receiverId);

    // Transaction: update request and insert friendship
    db.run(`UPDATE friend_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [requestId], (upErr) => {
      if (upErr) return res.status(500).json({ message: 'Failed to update request status' });

      db.run(`INSERT INTO friendships (user_one_id, user_two_id) VALUES (?, ?) ON CONFLICT DO NOTHING`, [u1, u2], (fErr) => {
        if (fErr) return res.status(500).json({ message: 'Failed to create friendship record' });

        // Emit real-time events to both users
        try {
          const io = getIO();
          io.to(`user_${senderId}`).to(`user_${receiverId}`).emit('friendship_created', {
            userOneId: senderId,
            userTwoId: receiverId,
            requestId
          });
          io.to(`user_${senderId}`).emit('friend_request_accepted', {
            requestId,
            acceptedBy: {
              id: req.user.id,
              name: req.user.fullName || req.user.name
            }
          });
        } catch (e) {}

        return res.status(200).json({ message: 'Friend request accepted successfully!' });
      });
    });
  });
};

// Reject / Decline Friend Request
export const rejectFriendRequest = (req, res) => {
  const userId = req.user.id;
  const requestId = Number(req.params.id);

  db.get(`SELECT * FROM friend_requests WHERE id = ?`, [requestId], (err, freq) => {
    if (err || !freq) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (Number(freq.receiver_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Not authorized to decline this request' });
    }

    db.run(`UPDATE friend_requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [requestId], (upErr) => {
      if (upErr) return res.status(500).json({ message: 'Failed to reject friend request' });

      try {
        const io = getIO();
        io.to(`user_${freq.sender_id}`).emit('friend_request_rejected', { requestId });
      } catch (e) {}

      return res.status(200).json({ message: 'Friend request declined' });
    });
  });
};

// Cancel Pending Friend Request (Sender cancels)
export const cancelFriendRequest = (req, res) => {
  const userId = req.user.id;
  const requestId = Number(req.params.id);

  db.get(`SELECT * FROM friend_requests WHERE id = ?`, [requestId], (err, freq) => {
    if (err || !freq) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (Number(freq.sender_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    db.run(`DELETE FROM friend_requests WHERE id = ?`, [requestId], (delErr) => {
      if (delErr) return res.status(500).json({ message: 'Failed to cancel request' });

      try {
        const io = getIO();
        io.to(`user_${freq.receiver_id}`).emit('friend_request_cancelled', { requestId });
      } catch (e) {}

      return res.status(200).json({ message: 'Friend request cancelled' });
    });
  });
};

// Get User's Confirmed Friends List
export const getUserFriends = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT u.id, u.fullName as name, u.email, u.avatar, u.status, u.createdAt
    FROM friendships f
    JOIN users u ON (f.user_one_id = u.id OR f.user_two_id = u.id)
    WHERE (f.user_one_id = ? OR f.user_two_id = ?) AND u.id != ?
    ORDER BY u.fullName ASC
  `;

  db.all(query, [userId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error fetching friends' });
    return res.status(200).json({ friends: rows || [] });
  });
};

// Remove Friend (Unfriend)
export const removeFriend = (req, res) => {
  const userId = req.user.id;
  const friendId = Number(req.params.friendId);

  if (!friendId || isNaN(friendId)) {
    return res.status(400).json({ message: 'Valid friendId is required' });
  }

  const u1 = Math.min(userId, friendId);
  const u2 = Math.max(userId, friendId);

  db.run(
    `DELETE FROM friendships WHERE (user_one_id = ? AND user_two_id = ?) OR (user_one_id = ? AND user_two_id = ?)`,
    [u1, u2, u2, u1],
    function (err) {
      if (err) return res.status(500).json({ message: 'Failed to remove friend' });

      // Clean up requests as well
      db.run(
        `DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
        [userId, friendId, friendId, userId],
        () => {}
      );

      try {
        const io = getIO();
        io.to(`user_${userId}`).to(`user_${friendId}`).emit('friendship_removed', {
          userId,
          friendId
        });
      } catch (e) {}

      return res.status(200).json({ message: 'Friend removed successfully' });
    }
  );
};
