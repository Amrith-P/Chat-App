import express from 'express';
import { searchUsers, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserById);

export default router;
