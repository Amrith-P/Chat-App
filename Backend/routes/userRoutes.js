import express from 'express';
import { searchUsers, getUserById, updateProfile, changePassword } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/search', protect, searchLimiter, searchUsers);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);

export default router;
