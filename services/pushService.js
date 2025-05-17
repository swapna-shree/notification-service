require('dotenv').config();
const axios = require('axios');

/**
 * Push Notification Service using Firebase Cloud Messaging (FCM)
 * Environment variables:
 * - FCM_SERVER_KEY: Firebase Cloud Messaging server key
 * - FCM_API_URL: Firebase Cloud Messaging API URL (default: https://fcm.googleapis.com/fcm/send)
 */
class PushService {
  constructor() {
    this.fcmServerKey = process.env.FCM_SERVER_KEY;
    this.fcmApiUrl = process.env.FCM_API_URL || 'https://fcm.googleapis.com/fcm/send';
    
    if (!this.fcmServerKey) {
      console.warn('FCM_SERVER_KEY is not set. Push notifications will not work.');
    }
  }

  /**
   * Send push notification to a user's device(s)
   * @param {string} deviceToken - The FCM device token
   * @param {Object} message - The notification message object
   * @param {string} message.title - The notification title
   * @param {string} message.body - The notification body
   * @param {Object} [message.data] - Additional data to send with the notification
   * @returns {Promise<Object>} - Response from FCM
   */
  async send(deviceToken, message) {
    if (!this.fcmServerKey) {
      throw new Error('FCM_SERVER_KEY is not set. Cannot send push notifications.');
    }

    if (!deviceToken) {
      throw new Error('Device token is required to send push notification');
    }

    try {
      const payload = {
        to: deviceToken,
        notification: {
          title: message.title || 'New Notification',
          body: message.body || '',
          sound: 'default',
          badge: 1
        },
        data: message.data || {},
        priority: 'high'
      };
      
      const response = await axios.post(this.fcmApiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.fcmServerKey}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Push notification error:', error.response?.data || error.message);
      throw new Error(`Failed to send push notification: ${error.message}`);
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {string[]} deviceTokens - Array of FCM device tokens
   * @param {Object} message - The notification message object
   * @returns {Promise<Object>} - Response from FCM
   */
  async sendMultiple(deviceTokens, message) {
    if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
      throw new Error('Device tokens array is required and cannot be empty');
    }
    
    try {
      const payload = {
        registration_ids: deviceTokens,
        notification: {
          title: message.title || 'New Notification',
          body: message.body || '',
          sound: 'default',
          badge: 1
        },
        data: message.data || {},
        priority: 'high'
      };
      
      const response = await axios.post(this.fcmApiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.fcmServerKey}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Push notification error:', error.response?.data || error.message);
      throw new Error(`Failed to send push notifications: ${error.message}`);
    }
  }
}

module.exports = new PushService(); 