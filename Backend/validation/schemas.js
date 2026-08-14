import { z } from 'zod';

// Registration Schema
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password is too long'),
});

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Message Creation Schema
export const sendMessageSchema = z.object({
  chatId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== undefined && val !== '', 'Chat ID is required'),
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(5000, 'Message content cannot exceed 5000 characters')
    .trim(),
  replyToId: z
    .union([z.string(), z.number(), z.null()])
    .optional(),
});

// User Search Schema
export const userSearchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query is too long')
    .trim(),
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters')
    .trim()
    .optional(),
  status: z
    .string()
    .max(150, 'Status bio must not exceed 150 characters')
    .trim()
    .optional(),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .optional(),
});

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters long')
    .max(100, 'New password is too long'),
});
