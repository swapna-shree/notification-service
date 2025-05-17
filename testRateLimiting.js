require('dotenv').config();
const axios = require('axios');

/**
 * Script to test rate limiting functionality
 * Tests sending multiple notifications of different types in quick succession
 * to trigger rate limiting
 */
async function testRateLimiting() {
  // Configuration
  const userId = 'rate-limit-test-user';
  const baseUrl = 'http://localhost:' + (process.env.PORT || 5000);
  
  console.log('Starting rate limit test...');
  console.log('------------------------------------------------');
  
  // Test function to send notifications and check limits
  async function testType(type, count, interval = 100) {
    console.log(`\nTesting ${type} notification rate limiting...`);
    console.log(`Sending ${count} ${type} notifications with ${interval}ms interval`);
    
    let successCount = 0;
    let limitedCount = 0;
    
    // Test initial limits
    await checkLimits(type);
    
    // Send notifications in rapid succession
    for (let i = 0; i < count; i++) {
      try {
        const notificationData = createNotificationData(type, i);
        
        const response = await axios.post(`${baseUrl}/notifications`, notificationData);
        
        if (response.data.success) {
          successCount++;
          console.log(`✅ ${type} notification #${i+1} sent successfully`);
        }
      } catch (error) {
        limitedCount++;
        if (error.response && error.response.status === 429) {
          console.log(`❌ ${type} notification #${i+1} rate limited: ${error.response.data.error}`);
        } else {
          console.error(`Error sending ${type} notification #${i+1}:`, error.message);
        }
      }
      
      // Wait a bit between requests
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // Check limits after test
    await checkLimits(type);
    
    console.log(`\n${type} test summary:`);
    console.log(`- Successful: ${successCount}/${count}`);
    console.log(`- Rate limited: ${limitedCount}/${count}`);
    console.log('------------------------------------------------');
  }
  
  // Helper to create test notification data
  function createNotificationData(type, index) {
    const baseData = {
      type,
      userId,
      message: `Test ${type} notification #${index+1} for rate limiting`
    };
    
    switch (type) {
      case 'email':
        return {
          ...baseData,
          email: 'test@example.com',
          message: {
            subject: `Test Email #${index+1}`,
            body: `This is test email #${index+1} for rate limiting`
          }
        };
      case 'sms':
        return {
          ...baseData,
          phone: '+1234567890',
        };
      case 'push':
        return {
          ...baseData,
          deviceToken: 'test-device-token',
          message: {
            title: `Test Push #${index+1}`,
            body: `This is test push notification #${index+1} for rate limiting`
          }
        };
      default: // in-app
        return {
          ...baseData,
          message: {
            title: `Test In-App #${index+1}`,
            body: `This is test in-app notification #${index+1} for rate limiting`
          }
        };
    }
  }
  
  // Helper to check current limits
  async function checkLimits(type) {
    try {
      const response = await axios.get(`${baseUrl}/api/rate-limits/${userId}`);
      const limits = response.data.limits[type];
      
      console.log(`\nCurrent ${type} rate limits for user ${userId}:`);
      console.log(`- Minute: ${limits.minuteUsage}/${limits.minuteLimit}`);
      console.log(`- Hour: ${limits.hourUsage}/${limits.hourLimit}`);
      console.log(`- Day: ${limits.dayUsage}/${limits.dayLimit}`);
    } catch (error) {
      console.error('Error checking rate limits:', error.message);
    }
  }
  
  // Reset limits before testing
  async function resetLimits(type) {
    try {
      await axios.post(`${baseUrl}/api/rate-limits/${userId}/reset`, { type });
      console.log(`Reset ${type} rate limits for user ${userId}`);
    } catch (error) {
      console.error(`Error resetting ${type} rate limits:`, error.message);
    }
  }
  
  // Run tests for each notification type
  
  // First reset all limits
  for (const type of ['email', 'sms', 'in-app', 'push']) {
    await resetLimits(type);
  }
  
  // Test SMS (lowest limits)
  await testType('sms', 3, 200);
  
  // Test Email
  await testType('email', 5, 200);
  
  // Test Push
  await testType('push', 6, 200);
  
  // Test In-App (highest limits)
  await testType('in-app', 10, 100);
  
  console.log('Rate limit tests completed');
}

// Run tests
testRateLimiting()
  .then(() => {
    console.log('All tests completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  }); 