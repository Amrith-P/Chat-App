import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  sendFriendRequest,
  getFriendRequests,
  getFriendRequestCount,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getUserFriends,
  removeFriend
} from '../controllers/friendController.js';

const router = express.Router();

// Require authentication for all friend routes
router.use(authenticateToken);

// Friend Request Routes
router.post('/requests', sendFriendRequest);
router.get('/requests', getFriendRequests);
router.get('/requests/count', getFriendRequestCount);
router.post('/requests/:id/accept', acceptFriendRequest);
router.post('/requests/:id/reject', rejectFriendRequest);
router.delete('/requests/:id', cancelFriendRequest);

// Friends List & Unfriend Routes
router.get('/', getUserFriends);
router.delete('/:friendId', removeFriend);

export default router;
