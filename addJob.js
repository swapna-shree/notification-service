require("dotenv").config();
const { Queue } = require("bullmq");
const connection = require("./config/redis");

async function addJob() {
  const queue = new Queue("notification", { connection });

  await queue.add("test-job", {
    type: "email",
    userId: "swapnashree2020@gmail.com",
    message: "Hello, this is a test notification!",
  });

  console.log("Job added");
  process.exit(0);
}

addJob();
