import express from 'express';
import { getUserChats, createOrGetDirectChat, deleteChat } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getUserChats);
router.post('/', protect, createOrGetDirectChat);
router.delete('/:chatId', protect, deleteChat);

export default router;
