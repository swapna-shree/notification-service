require("dotenv").config();
const { Worker } = require("bullmq");
const connection = require("../config/redis");
const emailService = require("../services/emailService");
const smsService = require("../services/smsService");
const inAppService = require("../services/inAppService");

console.log("Starting notification worker...");

const worker = new Worker(
  "notification",
  async (job) => {
    console.log("Processing job:", job.id, job.data);

    const { type, userId, message } = job.data;

    switch (type) {
      case "email":
        await emailService.send(userId, message);
        console.log("Email sent");
        break;
      case "sms":
        await smsService.send(userId, message);
        console.log("SMS sent");
        break;
      case "in-app":
        await inAppService.send(userId, message);
        console.log("In-app notification sent");
        break;
      default:
        console.log("Invalid notification type");
        throw new Error("Invalid notification type");
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});
