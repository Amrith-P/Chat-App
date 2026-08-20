import { loginLimiter, registerLimiter, authLimiter, apiLimiter } from '../middleware/rateLimiter.js';

describe('Security & Rate Limiter Configuration Tests', () => {
  test('loginLimiter should be a valid express middleware function', () => {
    expect(typeof loginLimiter).toBe('function');
  });

  test('registerLimiter should be a valid express middleware function', () => {
    expect(typeof registerLimiter).toBe('function');
  });

  test('authLimiter and apiLimiter should be valid express middleware functions', () => {
    expect(typeof authLimiter).toBe('function');
    expect(typeof apiLimiter).toBe('function');
  });
});
