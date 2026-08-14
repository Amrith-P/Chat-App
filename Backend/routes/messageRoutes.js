import express from 'express';
import { getMessagesByChatId, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendMessageSchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/:chatId', protect, getMessagesByChatId);
router.post('/', protect, validate(sendMessageSchema), sendMessage);

export default router;
