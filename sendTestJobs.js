const notificationQueue = require("./queues/notificationQueue");

(async () => {
  const job = await notificationQueue.add("send-notification", {
    type: "email",
    userId: "swapnashree2020", // Will be mapped to an email in notificationProcessor.js
    message: "Hello, this is a test notification!",
  });

  console.log("Test job queued with ID:", job.id);
})();
