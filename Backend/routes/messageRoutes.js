import express from 'express';
import { getMessagesByChatId, sendMessage, clearMessagesByChatId, deleteMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendMessageSchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/:chatId', protect, getMessagesByChatId);
router.post('/', protect, validate(sendMessageSchema), sendMessage);
router.delete('/chat/:chatId', protect, clearMessagesByChatId);
router.post('/chat/:chatId/clear', protect, clearMessagesByChatId);
router.delete('/:chatId/clear', protect, clearMessagesByChatId);
router.post('/:chatId/clear', protect, clearMessagesByChatId);
router.delete('/:id', protect, deleteMessage);

export default router;
