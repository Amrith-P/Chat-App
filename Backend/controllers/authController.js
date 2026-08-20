import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_chat_app_2026_xyz';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'super_secret_refresh_key_chat_app_2026_abc';

// Helper to generate short-lived Access Token (15 min)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Helper to generate long-lived Refresh Token (7 days)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Create & Store Session with Cookie Helper
const createSessionAndSendTokens = async (req, res, user, statusCode = 200, message = 'Success') => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const tokenHash = await bcrypt.hash(refreshToken, 8);

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

  db.run(
    'INSERT INTO user_sessions (userId, tokenHash, userAgent, ipAddress, expiresAt) VALUES (?, ?, ?, ?, ?)',
    [user.id, tokenHash, userAgent, ipAddress, expiresAt],
    (err) => {
      if (err) console.error('Failed to log session:', err.message);

      // Set HttpOnly Cookie for Refresh Token (Cross-Origin Persistent for 30 Days)
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // Required for SameSite=None
        sameSite: 'none', // Allows cross-domain cookie sending (Vercel -> Render)
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days persistence
      });

      res.status(statusCode).json({
        message,
        token: accessToken, // Short-lived Access Token in response body
        user
      });
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  const { fullName, email, password, avatar } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Please provide full name, email, and password' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;
      const finalAvatar = (avatar && avatar.trim()) ? avatar.trim() : defaultAvatar;

      db.run(
        'INSERT INTO users (fullName, email, password, avatar) VALUES (?, ?, ?, ?)',
        [fullName.trim(), normalizedEmail, hashedPassword, finalAvatar],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ message: 'Failed to create user', error: insertErr.message });
          }

          const user = {
            id: this.lastID,
            fullName: fullName.trim(),
            email: normalizedEmail,
            avatar: finalAvatar,
            status: 'Hey there! I am using ChatApp.'
          };

          createSessionAndSendTokens(req, res, user, 201, 'Registration successful');
        }
      );
    } catch (error) {
      res.status(500).json({ message: 'Server error during password processing', error: error.message });
    }
  });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const userProfile = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName)}`,
        status: user.status,
        publicKey: user.publicKey
      };

      createSessionAndSendTokens(req, res, userProfile, 200, 'Login successful');
    } catch (error) {
      res.status(500).json({ message: 'Error verifying credentials', error: error.message });
    }
  });
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none'
};

// @desc    Refresh Access Token using HttpOnly Cookie
// @route   POST /api/auth/refresh
export const refreshTokenHandler = (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(200).json({ authenticated: false, message: 'No active session' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    db.get(
      'SELECT * FROM users WHERE id = ?',
      [decoded.id],
      (err, user) => {
        if (err || !user) {
          res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
          res.clearCookie('refreshToken');
          return res.status(200).json({ authenticated: false, message: 'User session invalid' });
        }

        const userProfile = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName)}`,
          status: user.status,
          publicKey: user.publicKey
        };

        const newAccessToken = generateAccessToken(userProfile);

        res.json({
          authenticated: true,
          message: 'Token refreshed successfully',
          token: newAccessToken,
          user: userProfile
        });
      }
    );
  } catch (error) {
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
    res.clearCookie('refreshToken');
    return res.status(200).json({ authenticated: false, message: 'Refresh token invalid or expired' });
  }
};

// @desc    Logout User & Clear Cookie
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

// @desc    Revoke All Active Sessions for User ("Logout from all devices")
// @route   POST /api/auth/revoke-all
export const revokeAllSessions = (req, res) => {
  const userId = req.user.id;

  db.run(
    'UPDATE user_sessions SET isRevoked = 1 WHERE userId = ?',
    [userId],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to revoke sessions' });
      }
      res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
      res.clearCookie('refreshToken');
      res.json({ message: 'All active sessions have been revoked. Please log in again.' });
    }
  );
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
export const forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide your email address' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset token has been sent.'
      });
    }

    const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiry = Date.now() + 3600000; // 1 hour

    db.run(
      'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
      [resetToken, expiry, normalizedEmail],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: 'Failed to set reset token' });
        }

        res.json({
          message: 'Password reset instructions generated successfully.',
          resetToken: resetToken,
          info: `Reset Code: ${resetToken}`
        });
      }
    );
  });
};

// @desc    Reset Password using token
// @route   POST /api/auth/reset-password
export const resetPassword = (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'Email, reset token, and new password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: 'Invalid reset request' });
    }

    if (user.resetToken !== resetToken || Date.now() > user.resetTokenExpiry) {
      return res.status(400).json({ message: 'Reset code is invalid or has expired' });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      db.run(
        'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE email = ?',
        [hashedPassword, normalizedEmail],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: 'Failed to update password' });
          }

          res.json({ message: 'Password reset successful! You can now log in with your new password.' });
        }
      );
    } catch (error) {
      res.status(500).json({ message: 'Error processing password update' });
    }
  });
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/me
export const getMe = (req, res) => {
  const userId = req.user.id;

  db.get('SELECT id, fullName, email, avatar, status, createdAt FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    res.json({ user });
  });
};
