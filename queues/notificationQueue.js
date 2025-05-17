const { Queue } = require('bullmq');
const connection = require('../config/redis');
const notificationQueue = new Queue('notification', { connection });
module.exports = notificationQueue;
