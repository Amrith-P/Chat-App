import express from 'express';
import { getUserChats, createOrGetDirectChat } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getUserChats);
router.post('/', protect, createOrGetDirectChat);

export default router;
