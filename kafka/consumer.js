const { Kafka } = require('kafkajs');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const inAppService = require('../services/inAppService');
const pushService = require('../services/pushService');
const redis = require('../config/redis');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'notification-service-consumer',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });
let isConnected = false;

// Map notification types to their respective services
const notificationHandlers = {
  'email': emailService.sendEmail,
  'sms': smsService.sendSMS,
  'in-app': inAppService.saveNotification,
  'push': pushService.sendPushNotification
};

// Connect consumer on startup
async function connect() {
  if (!isConnected) {
    try {
      await consumer.connect();
      await consumer.subscribe({ topic: 'notifications', fromBeginning: false });
      isConnected = true;
      console.log('Kafka consumer connected and subscribed to notifications topic');
    } catch (error) {
      console.error('Failed to connect Kafka consumer:', error);
      // Retry connection after delay
      setTimeout(connect, 5000);
    }
  }
}

// Start consuming messages
async function run() {
  await connect();
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const notificationType = message.headers['notification-type']?.toString() || 'unknown';
        const value = JSON.parse(message.value.toString());
        
        console.log(`Processing ${notificationType} notification for user ${value.userId}`);
        
        const handler = notificationHandlers[value.type];
        if (!handler) {
          console.error(`No handler found for notification type: ${value.type}`);
          return;
        }
        
        // Process the notification with appropriate service
        const result = await handler(value);
        
        // Store notification for retrieval via API
        await redis.lpush('notifications', JSON.stringify({
          id: Date.now(),
          type: value.type,
          userId: value.userId,
          message: value.message,
          timestamp: new Date(),
          status: 'delivered'
        }));
        
        console.log(`Successfully processed ${value.type} notification for user ${value.userId}`);
        
        // Don't keep too many notifications in Redis
        await redis.ltrim('notifications', 0, 999);
        
      } catch (error) {
        console.error('Error processing notification:', error);
        
        // Store failed notification
        if (message.value) {
          try {
            const value = JSON.parse(message.value.toString());
            await redis.lpush('failed_notifications', JSON.stringify({
              ...value,
              error: error.message,
              timestamp: new Date()
            }));
          } catch (parseError) {
            console.error('Error parsing failed notification:', parseError);
          }
        }
      }
    },
  });
}

// Graceful shutdown
async function disconnect() {
  if (isConnected) {
    try {
      await consumer.disconnect();
      isConnected = false;
      console.log('Kafka consumer disconnected');
    } catch (error) {
      console.error('Error disconnecting Kafka consumer:', error);
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  run,
  disconnect
}; 