require('dotenv').config();
const producer = require('./rabbitmq/producer');

async function runTests() {
  console.log('Starting notification service tests...');
  
  try {
    // Test email notification
    await producer.sendMessage('email-test', {
      type: 'email',
      userId: 'test-user-123',
      email: 'test@example.com',
      message: {
        subject: 'Test Email Notification',
        body: 'This is a test email notification from the notification service'
      }
    });
    console.log('Email notification test message sent to RabbitMQ');
    
    // Test SMS notification
    await producer.sendMessage('sms-test', {
      type: 'sms',
      userId: 'test-user-123',
      phone: '+1234567890',
      message: 'This is a test SMS notification from the notification service'
    });
    console.log('SMS notification test message sent to RabbitMQ');
    
    // Test in-app notification
    await producer.sendMessage('in-app-test', {
      type: 'in-app',
      userId: 'test-user-123',
      message: {
        title: 'Test Notification',
        body: 'This is a test in-app notification',
        data: { action: 'view', entityId: '12345' }
      }
    });
    console.log('In-app notification test message sent to RabbitMQ');
    
    // Test push notification
    await producer.sendMessage('push-test', {
      type: 'push',
      userId: 'test-user-123',
      deviceToken: 'test-device-token-123',
      message: {
        title: 'Test Push Notification',
        body: 'This is a test push notification',
        data: { action: 'open', entityId: '12345' }
      }
    });
    console.log('Push notification test message sent to RabbitMQ');
    
    // Test multi-device push notification
    await producer.sendMessage('multi-push-test', {
      type: 'push',
      userId: 'test-user-123',
      deviceTokens: ['device-token-1', 'device-token-2', 'device-token-3'],
      message: {
        title: 'Test Multi-Device Push',
        body: 'This is a test push notification to multiple devices',
        data: { action: 'view', entityId: '67890' }
      }
    });
    console.log('Multi-device push notification test message sent to RabbitMQ');
    
    console.log('All test messages sent successfully');
    
    // Disconnect from RabbitMQ
    await producer.disconnect();
  } catch (error) {
    console.error('Error running notification tests:', error);
    
    // Make sure to disconnect even if tests fail
    try {
      await producer.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from RabbitMQ:', disconnectError);
    }
  }
}

runTests()
  .then(() => {
    console.log('Test script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test script failed:', err);
    process.exit(1);
  }); 