import rateLimit from 'express-rate-limit';

// Strict limiter for authentication endpoints to prevent brute-force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
});

// Dedicated login brute-force protection
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    code: 'TOO_MANY_LOGIN_ATTEMPTS',
  },
});

// Dedicated registration spam protection
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 account registrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Account registration limit reached for this IP. Please try again in an hour.',
    code: 'TOO_MANY_REGISTRATIONS',
  },
});

// Moderate limiter for user search API
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // limit each IP to 60 search requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Search rate limit exceeded. Please slow down your requests.',
    code: 'TOO_MANY_REQUESTS',
  },
});

// General limiter for rest of API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many API requests from this IP. Please try again later.',
    code: 'TOO_MANY_REQUESTS',
  },
});
