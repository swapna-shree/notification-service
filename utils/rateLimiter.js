/**
 * Rate Limiter Utility for Notification Service
 * 
 * This module provides rate limiting capabilities to prevent sending too many
 * notifications to a single user within a specific time window.
 */

const redis = require('../config/redis');

class RateLimiter {
  /**
   * Check if a notification can be sent to a user
   * @param {string} userId - The user ID
   * @param {string} type - The notification type (email, sms, in-app, push)
   * @param {Object} options - Rate limiting options
   * @param {number} options.maxPerMinute - Maximum notifications per minute (default: 2)
   * @param {number} options.maxPerHour - Maximum notifications per hour (default: 20)
   * @param {number} options.maxPerDay - Maximum notifications per day (default: 50)
   * @returns {Promise<{allowed: boolean, reason: string|null}>} Whether the notification is allowed
   */
  async checkLimit(userId, type, options = {}) {
    if (!userId) {
      throw new Error('User ID is required for rate limiting');
    }
    
    const defaults = {
      maxPerMinute: 2,
      maxPerHour: 20,
      maxPerDay: 50
    };
    
    const config = { ...defaults, ...options };
    
    // Keys for tracking counts at different time windows
    const minuteKey = `ratelimit:${type}:${userId}:minute`;
    const hourKey = `ratelimit:${type}:${userId}:hour`;
    const dayKey = `ratelimit:${type}:${userId}:day`;
    
    // Get current counts
    const [minuteCount, hourCount, dayCount] = await Promise.all([
      redis.get(minuteKey),
      redis.get(hourKey),
      redis.get(dayKey)
    ]);
    
    // Check if any limits are exceeded
    if (minuteCount && parseInt(minuteCount) >= config.maxPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${config.maxPerMinute} ${type} notifications per minute`
      };
    }
    
    if (hourCount && parseInt(hourCount) >= config.maxPerHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${config.maxPerHour} ${type} notifications per hour`
      };
    }
    
    if (dayCount && parseInt(dayCount) >= config.maxPerDay) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${config.maxPerDay} ${type} notifications per day`
      };
    }
    
    return { allowed: true, reason: null };
  }
  
  /**
   * Increment the notification counter for a user
   * @param {string} userId - The user ID
   * @param {string} type - The notification type
   * @returns {Promise<void>}
   */
  async increment(userId, type) {
    if (!userId) {
      throw new Error('User ID is required for rate limiting');
    }
    
    // Keys for different time windows
    const minuteKey = `ratelimit:${type}:${userId}:minute`;
    const hourKey = `ratelimit:${type}:${userId}:hour`;
    const dayKey = `ratelimit:${type}:${userId}:day`;
    
    // Update all counters in a pipeline
    const pipeline = redis.pipeline();
    
    pipeline.incr(minuteKey);
    pipeline.expire(minuteKey, 60); // 1 minute
    
    pipeline.incr(hourKey);
    pipeline.expire(hourKey, 3600); // 1 hour
    
    pipeline.incr(dayKey);
    pipeline.expire(dayKey, 86400); // 1 day
    
    await pipeline.exec();
  }
  
  /**
   * Reset rate limits for a user
   * @param {string} userId - The user ID
   * @param {string} type - The notification type
   * @returns {Promise<void>}
   */
  async reset(userId, type) {
    if (!userId) {
      throw new Error('User ID is required for rate limiting');
    }
    
    // Keys for different time windows
    const minuteKey = `ratelimit:${type}:${userId}:minute`;
    const hourKey = `ratelimit:${type}:${userId}:hour`;
    const dayKey = `ratelimit:${type}:${userId}:day`;
    
    await redis.del(minuteKey, hourKey, dayKey);
  }
}

module.exports = new RateLimiter(); 