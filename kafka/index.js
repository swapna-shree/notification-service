const producer = require('./producer');
const consumer = require('./consumer');

module.exports = {
  producer,
  consumer,
  // Initialize Kafka 
  init: async () => {
    try {
      // Start consumer for processing notifications
      consumer.run();
      console.log('Kafka system initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Kafka:', error);
      return false;
    }
  },
  // Shutdown Kafka connections
  shutdown: async () => {
    try {
      await producer.disconnect();
      await consumer.disconnect();
      console.log('Kafka system shutdown complete');
      return true;
    } catch (error) {
      console.error('Error during Kafka shutdown:', error);
      return false;
    }
  }
}; 