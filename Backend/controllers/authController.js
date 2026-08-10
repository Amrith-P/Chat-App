import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName },
    process.env.JWT_SECRET || 'super_secret_jwt_key_chat_app_2026_xyz',
    { expiresIn: '7d' }
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

  // Check if user exists
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

          const token = generateToken(user);

          res.status(201).json({
            message: 'Registration successful',
            token,
            user
          });
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
        status: user.status
      };

      const token = generateToken(userProfile);

      res.json({
        message: 'Login successful',
        token,
        user: userProfile
      });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying credentials', error: error.message });
    }
  });
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
      // Return success even if email not found to prevent user enumeration
      return res.json({
        message: 'If an account with that email exists, a password reset link/token has been sent.'
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
          resetToken: resetToken, // Returned for easy dev testing
          info: `In production an email would be sent to ${normalizedEmail}. Reset Code: ${resetToken}`
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
