/**
 * Rate Limiting Middleware for Notification API
 * 
 * This middleware applies rate limiting to notification API requests
 * based on user ID and notification type.
 */
const rateLimiter = require('../utils/rateLimiter');

/**
 * Configuration for different notification types
 */
const rateLimits = {
  email: {
    maxPerMinute: 2,
    maxPerHour: 10,
    maxPerDay: 20
  },
  sms: {
    maxPerMinute: 1,
    maxPerHour: 5,
    maxPerDay: 10
  },
  'in-app': {
    maxPerMinute: 5,
    maxPerHour: 30,
    maxPerDay: 100
  },
  push: {
    maxPerMinute: 3,
    maxPerHour: 15,
    maxPerDay: 50
  }
};

/**
 * Middleware to apply rate limiting to notification API requests
 */
async function rateLimitMiddleware(req, res, next) {
  // Skip if not a notification request
  if (!req.body.type || !req.body.userId) {
    return next();
  }

  const { type, userId } = req.body;
  
  try {
    // Apply type-specific rate limits or default ones
    const limits = rateLimits[type] || { maxPerMinute: 2, maxPerHour: 20, maxPerDay: 50 };
    
    // Check if rate limit is exceeded
    const result = await rateLimiter.checkLimit(userId, type, limits);
    
    if (!result.allowed) {
      // If rate limited, return 429 Too Many Requests
      return res.status(429).json({
        success: false,
        error: result.reason,
        retryAfter: type === 'sms' ? 60 : 30 // Suggest retry time based on type
      });
    }
    
    // Store the original end function
    const originalEnd = res.end;
    
    // Override end function to increment counter on successful response
    res.end = function(chunk, encoding) {
      // Call the original end function
      originalEnd.call(this, chunk, encoding);
      
      // If response was successful, increment counter
      if (res.statusCode >= 200 && res.statusCode < 300) {
        rateLimiter.increment(userId, type)
          .catch(err => console.error('Failed to increment rate limit counter:', err));
      }
    };
    
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Don't block the request if rate limiting fails
    next();
  }
}

module.exports = rateLimitMiddleware; 