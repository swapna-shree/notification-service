# 📣 Notification Service: Your Message's VIP Lounge 🚀

> **Where messages get the red-carpet treatment before sliding into your users' DMs!**

Ever wished your app's notifications weren't as boring as watching paint dry? Say no more! This notification service is the cool DJ that ensures your messages drop with perfect timing and style. It's not just a notification service; it's notification service with *attitude*. 

## ✨ What's Cooking?

* 📧 **Email Notifications** - Because sometimes "u up?" needs proper formatting
* 📱 **SMS Alerts** - Text messages that actually arrive (revolutionary, we know)
* 🔔 **Push Notifications** - Coming soon! Making phones buzz with purpose (Planned feature)
* 📲 **In-App Messages** - Sliding into your users' app experience like it owns the place

## 🔥 The Secret Sauce

* **RabbitMQ** - Our tireless message courier that never takes coffee breaks
* **Redis** - The bouncer that says "Whoa there! Too many messages, buddy" when needed
* **Express API** - Slick endpoints that make developers actually *want* to read the docs
* **Scalability** - Handles messages from whisper to stadium-level shouting

Built with Node.js and enough caffeine to power a small city. Fork it, star it, or just admire it from afar. Your notifications will thank you.

---

# Notification Service

A scalable, multi-channel notification service built with Node.js, Redis, and RabbitMQ. This service supports email, SMS, in-app, and push notifications with rate limiting and reliability features.

## Features

- **Multi-channel Notifications:**
  - Email notifications (via Nodemailer with any SMTP server)
  - SMS notifications (via Twilio)
  - In-app notifications (stored in Redis)
  - Push notifications (via Firebase Cloud Messaging) - *Coming soon as a future feature*

- **Reliability:**
  - Event-driven architecture using RabbitMQ
  - Message queue processing with acknowledgments
  - Automatic retries and dead-letter handling
  - Graceful error handling and failure recovery
  - Worker process isolation for fault tolerance

- **Rate Limiting:**
  - Configurable per-user and per-channel rate limits
  - Per-minute, per-hour, and per-day limits
  - API endpoint to check current rate limits
  - Safety measures at both API and worker levels

## Project Structure

```
notification-service/
├── config/                  # Configuration files
│   └── redis.js             # Redis connection configuration
├── controllers/             # API controllers
│   └── notificationController.js  # Notification endpoints
├── rabbitmq/                # RabbitMQ implementation
│   ├── consumer.js          # RabbitMQ consumer for processing notifications
│   ├── producer.js          # RabbitMQ producer for sending notifications
│   └── worker.js            # RabbitMQ worker script
├── middleware/              # Express middleware
│   └── rateLimitMiddleware.js    # Rate limiting middleware

├── routes/                  # API routes
│   └── notificationRoutes.js # Notification API routes
├── services/                # Service implementations
│   ├── emailService.js      # Email notification service
│   ├── smsService.js        # SMS notification service
│   ├── inAppService.js      # In-app notification service
│   └── pushService.js       # Push notification service (coming soon)
├── utils/                   # Utility functions
│   └── rateLimiter.js       # Rate limiting utility
├── app.js                   # Express application setup
├── docker-compose.yml       # Docker compose configuration
├── env.example              # Example environment variables
├── package.json             # Project dependencies
├── server.js                # Main API server
├── testNotificationService.js  # Notification testing script
├── testRabbitMQNotification.js # RabbitMQ testing script
└── testRateLimiting.js      # Rate limiting testing script
```

## Prerequisites

- Node.js 14.x or higher
- Redis 6.x or higher
- RabbitMQ 3.x or higher
- SMTP server for email notifications
- Twilio account for SMS notifications
- Firebase project for push notifications (for future implementation)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/notification-service.git
cd notification-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the example:
```bash
cp env.example .env
```

4. Update the `.env` file with your credentials:
```
PORT=5000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=notifications

# For email notifications with a real SMTP server
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# For SMS, get credentials from Twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# For future push notifications feature (coming soon)
# FCM_SERVER_KEY=your_firebase_server_key
# FCM_API_URL=https://fcm.googleapis.com/fcm/send
```

## Running the Service

1. Start RabbitMQ:
```bash
docker-compose up -d rabbitmq
```

2. Start Redis:
```bash
docker-compose up -d redis
```

3. Start the API server:
```bash
npm start
# or
node server.js
```

4. Start the RabbitMQ worker:
```bash
npm run worker
# or
node rabbitmq/worker.js
```

For development with auto-restart:
```bash
npm run dev
```

## Docker Setup

The service can be run using Docker and Docker Compose:

1. Make sure Docker and Docker Compose are installed
2. Build and start the services:
```bash
docker-compose up -d
```

This will start RabbitMQ, Redis, API server, and the worker.

## Testing

Test basic notification functionality:
```bash
npm run test:notification
# or
node testNotificationService.js
```

Test rate limiting functionality:
```bash
npm run test:ratelimit
# or
node testRateLimiting.js
```

Test RabbitMQ integration:
```bash
npm run test:rmq
# or
node testRabbitMQNotification.js
```

## API Documentation

See [API.md](API.md) for detailed API documentation.

### Send a notification
Sends a notification through the specified channel.

**URL**: `/api/notifications`  
**Method**: `POST`  
**Auth required**: No (In production, you should add authentication)

**Request body**:
```json
{
  "type": "email|sms|in-app|push",
  "userId": "user123",
  
  // For email
  "email": "user@example.com",  // Optional if userId is provided
  "message": {
    "subject": "Hello",
    "body": "This is a test email"
  },
  
  // For SMS
  "phone": "+1234567890",
  "message": "This is a test SMS",
  
  // For in-app
  "message": {
    "title": "Hello",
    "body": "This is an in-app notification",
    "data": { "action": "view", "entityId": "123" }
  },
  
  // For push
  "deviceToken": "device-token-123",  // For single device
  // OR
  "deviceTokens": ["token1", "token2"], // For multiple devices
  "message": {
    "title": "Hello",
    "body": "This is a push notification",
    "data": { "action": "open", "entityId": "123" }
  }
}
```

### Get user notifications
Retrieves notifications for a specific user.

**URL**: `/api/users/:id/notifications`  
**Method**: `GET`

## Architecture

The service uses a message-based architecture with RabbitMQ:

1. API server receives notification requests
2. Requests are validated and rate-limited
3. Valid requests are sent to RabbitMQ message queue
4. Worker processes consume messages from RabbitMQ
5. Workers send notifications through appropriate channels
6. Results and metrics are stored in Redis for monitoring

## Rate Limiting Configuration

Rate limits can be configured in `middleware/rateLimitMiddleware.js` and are currently set to:

| Type   | Per Minute | Per Hour | Per Day |
|--------|------------|----------|---------|
| Email  | 2          | 10       | 20      |
| SMS    | 1          | 5        | 10      |
| In-app | 5          | 30       | 100     |
| Push   | 3          | 15       | 50      |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.