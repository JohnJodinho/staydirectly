// server/utils/rateLimiter.ts

import rateLimit, { Options as RateLimitOptions } from 'express-rate-limit';
import { Request } from 'express';

// Extend Express Request type to include 'user' property
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id?: string };
  }
}

/**
 * Generic IP-based rate limiter
 * - Applies to general public routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Stricter rate limiter for sensitive routes (auth, API)
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please slow down and try again.',
});

/**
 * Authenticated user-based rate limiter
 * - Useful when there is need to limit based on user ID or API token
 */
export const userRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  keyGenerator: (req: Request): string => {
    // Use user ID or token if available, fallback to IP
    return req.user?.id || req.headers['x-api-key']?.toString() || req.ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests for this user/token.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Utility to create a custom rate limiter
 * @param options Partial<RateLimit.Options> to override defaults
 */
export function createCustomRateLimiter(options: Partial<RateLimitOptions> = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? 10 * 60 * 1000, // 10 min default
    max: options.max ?? 20,
    keyGenerator: options.keyGenerator ?? ((req) => req.ip || 'unknown'),
    handler: options.handler ?? ((req, res) => {
      res.status(429).json({ error: 'Too many requests.' });
    }),
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
}
