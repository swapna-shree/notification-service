require('dotenv').config();
const express = require('express');
const redis = require('./config/redis');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const rabbitMQProducer = require('./rabbitmq/producer');
const app = express();

app.use(express.json());

// Helper function to get notifications from Redis
async function getNotificationsFromRedis(userId = null) {
  const notifications = await redis.lrange('notifications', 0, -1);
  const parsedNotifications = notifications.map(n => JSON.parse(n));
  
  if (userId) {
    return parsedNotifications.filter(n => n.userId === userId);
  }
  return parsedNotifications;
}

// Simple notification endpoint
app.post('/notifications', rateLimitMiddleware, async (req, res) => {
  try {
    const { message, userId, type = 'in-app' } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: message and userId are required' 
      });
    }
    
    // Create notification object
    const notification = {
      id: Date.now(),
      type,
      message,
      userId,
      timestamp: new Date()
    };
    
    // Store notification in Redis
    await redis.lpush('notifications', JSON.stringify(notification));
    
    // Send to RabbitMQ
    await rabbitMQProducer.sendMessage(type, {
      type,
      userId,
      message: type === 'in-app' ? { title: 'New Notification', body: message } : message,
      ...req.body // Include any additional params like email, phone, deviceToken
    });
    
    console.log('New notification sent to RabbitMQ:', notification);
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

// Get all notifications
app.get('/notifications', async (req, res) => {
  try {
    const notifications = await getNotificationsFromRedis();
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// Get notifications for specific user
app.get('/notifications/:userId', async (req, res) => {
  try {
    const userNotifications = await getNotificationsFromRedis(req.params.userId);
    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user notifications' });
  }
});

// Clear all notifications (for testing)
app.delete('/notifications', async (req, res) => {
  try {
    await redis.del('notifications');
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to clear notifications' });
  }
});

// API endpoint for rate limit status check
app.get('/api/rate-limits/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const notificationTypes = ['email', 'sms', 'in-app', 'push'];
    
    const limits = {};
    
    // Check rate limits for each notification type
    for (const type of notificationTypes) {
      const status = await redis.get(`ratelimit:${type}:${userId}:minute`);
      const hourStatus = await redis.get(`ratelimit:${type}:${userId}:hour`);
      const dayStatus = await redis.get(`ratelimit:${type}:${userId}:day`);
      
      limits[type] = {
        minuteUsage: status ? parseInt(status) : 0,
        hourUsage: hourStatus ? parseInt(hourStatus) : 0,
        dayUsage: dayStatus ? parseInt(dayStatus) : 0,
        minuteLimit: type === 'sms' ? 1 : (type === 'in-app' ? 5 : (type === 'push' ? 3 : 2)),
        hourLimit: type === 'sms' ? 5 : (type === 'in-app' ? 30 : (type === 'push' ? 15 : 10)),
        dayLimit: type === 'sms' ? 10 : (type === 'in-app' ? 100 : (type === 'push' ? 50 : 20))
      };
    }
    
    res.json({
      userId,
      limits
    });
  } catch (error) {
    console.error('Error fetching rate limits:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rate limits' });
  }
});

// Reset rate limits for a user (for testing purposes)
app.post('/api/rate-limits/:userId/reset', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Notification type is required'
      });
    }
    
    const rateLimiter = require('./utils/rateLimiter');
    await rateLimiter.reset(userId, type);
    
    res.json({
      success: true,
      message: `Rate limits for ${type} notifications reset for user ${userId}`
    });
  } catch (error) {
    console.error('Error resetting rate limits:', error);
    res.status(500).json({ success: false, error: 'Failed to reset rate limits' });
  }
});

module.exports = app;
