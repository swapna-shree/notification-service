const amqp = require('amqplib');
require('dotenv').config();

let connection = null;
let channel = null;
const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'notifications';

// Connect to RabbitMQ
async function connect() {
  try {
    if (!connection) {
      connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
      channel = await connection.createChannel();
      
      // Make sure queue exists with durable settings (survives broker restart)
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      
      console.log('RabbitMQ producer connected');
    }
    return { connection, channel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    // Try to reconnect after a delay
    setTimeout(connect, 5000);
    throw error;
  }
}

// Send message to RabbitMQ queue
async function sendMessage(routingKey, message) {
  try {
    if (!channel) {
      await connect();
    }
    
    // Prepare message content as Buffer
    const content = Buffer.from(JSON.stringify(message));
    
    // Set message properties (persistent: true makes message survive broker restart)
    const options = {
      persistent: true,
      contentType: 'application/json',
      headers: {
        'notification-type': message.type || 'unknown',
        timestamp: Date.now().toString()
      }
    };
    
    // Publish message to the queue
    await channel.sendToQueue(QUEUE_NAME, content, options);
    
    console.log(`Message for user ${message.userId} sent to RabbitMQ`);
    return true;
  } catch (error) {
    console.error('Error sending message to RabbitMQ:', error);
    // Try to reconnect
    channel = null;
    connection = null;
    throw error;
  }
}

// Graceful shutdown
async function disconnect() {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log('RabbitMQ producer disconnected');
  } catch (error) {
    console.error('Error disconnecting RabbitMQ producer:', error);
  } finally {
    channel = null;
    connection = null;
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

// Establish initial connection
connect().catch(console.error);

module.exports = {
  sendMessage,
  disconnect
}; 