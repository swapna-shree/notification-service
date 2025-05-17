require('dotenv').config();
const kafka = require('./index');

console.log('Starting Kafka notification worker...');

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Worker shutting down...');
  await kafka.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await kafka.shutdown();
  process.exit(0);
});

// Initialize Kafka system
kafka.init().then(() => {
  console.log('Notification worker is running and processing messages');
}).catch(error => {
  console.error('Failed to start notification worker:', error);
  process.exit(1);
}); 