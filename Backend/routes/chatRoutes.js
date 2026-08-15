import express from 'express';
import { 
  getUserChats, 
  createOrGetDirectChat, 
  deleteChat, 
  clearChatMessages, 
  toggleFavoriteChat 
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getUserChats);
router.post('/', protect, createOrGetDirectChat);
router.delete('/:chatId/messages', protect, clearChatMessages);
router.post('/:chatId/messages/clear', protect, clearChatMessages);
router.delete('/:chatId/clear', protect, clearChatMessages);
router.post('/:chatId/clear', protect, clearChatMessages);
router.post('/:chatId/favorite', protect, toggleFavoriteChat);
router.delete('/:chatId', protect, deleteChat);

export default router;
