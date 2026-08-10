import express from 'express';
import { getMessagesByChatId, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:chatId', protect, getMessagesByChatId);
router.post('/', protect, sendMessage);

export default router;
