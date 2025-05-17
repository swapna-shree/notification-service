const { Kafka } = require('kafkajs');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092']
});

const producer = kafka.producer();
let isConnected = false;

// Connect producer on startup
async function connect() {
  if (!isConnected) {
    try {
      await producer.connect();
      isConnected = true;
      console.log('Kafka producer connected');
    } catch (error) {
      console.error('Failed to connect Kafka producer:', error);
      // Retry connection after delay
      setTimeout(connect, 5000);
    }
  }
}

// Send message to Kafka topic
async function sendMessage(topic, message) {
  if (!isConnected) {
    await connect();
  }
  
  try {
    await producer.send({
      topic,
      messages: [
        { 
          key: message.userId || 'default', 
          value: JSON.stringify(message),
          headers: {
            'notification-type': message.type || 'unknown',
            timestamp: Date.now().toString()
          }
        }
      ]
    });
    
    return true;
  } catch (error) {
    console.error(`Error sending message to topic ${topic}:`, error);
    throw error;
  }
}

// Graceful shutdown
async function disconnect() {
  if (isConnected) {
    try {
      await producer.disconnect();
      isConnected = false;
      console.log('Kafka producer disconnected');
    } catch (error) {
      console.error('Error disconnecting Kafka producer:', error);
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

// Connect on module load
connect();

module.exports = {
  sendMessage,
  disconnect
}; 