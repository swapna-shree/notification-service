require('dotenv').config();
const consumer = require('./consumer');

console.log('Starting RabbitMQ notification worker...');

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Worker shutting down...');
  await consumer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await consumer.stop();
  process.exit(0);
});

// Start consuming messages
consumer.start().then(() => {
  console.log('Notification worker is running and processing messages');
}).catch(error => {
  console.error('Failed to start notification worker:', error);
  process.exit(1);
}); 