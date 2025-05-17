require("dotenv").config();
const http = require("http");
const app = require("./app");

// Initialize notification routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api', notificationRoutes);

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API with:`);
  console.log(`curl -X POST http://localhost:${PORT}/api/notifications -H "Content-Type: application/json" -d "{\\"message\\": \\"Hello\\", \\"userId\\": \\"123\\", \\"type\\": \\"in-app\\"}"`);
});
