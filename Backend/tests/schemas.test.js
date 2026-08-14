import { registerSchema, loginSchema, sendMessageSchema } from '../validation/schemas.js';

describe('Zod Schema Validation Tests', () => {
  test('registerSchema should validate valid input', () => {
    const validData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('registerSchema should fail on invalid email', () => {
    const invalidData = {
      fullName: 'Test User',
      email: 'invalid-email',
      password: 'password123',
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('loginSchema should validate valid login input', () => {
    const validData = {
      email: 'user@example.com',
      password: 'mypassword',
    };
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('sendMessageSchema should validate correct message format', () => {
    const validMessage = {
      chatId: 1,
      content: 'Hello World',
    };
    const result = sendMessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
  });

  test('sendMessageSchema should reject empty message content', () => {
    const invalidMessage = {
      chatId: 1,
      content: '',
    };
    const result = sendMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });
});
