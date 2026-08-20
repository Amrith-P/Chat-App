import express from 'express';
import { 
  register, 
  login, 
  refreshTokenHandler, 
  logout, 
  revokeAllSessions, 
  forgotPassword, 
  resetPassword, 
  getMe 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validation/schemas.js';

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);
router.post('/revoke-all', protect, revokeAllSessions);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', protect, getMe);

export default router;
