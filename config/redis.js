require("dotenv").config();
const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // To avoid BullMQ deprecation warning
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

module.exports = redisClient;
