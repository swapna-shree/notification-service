const { sendMessage } = require("../rabbitmq/producer");
const redis = require("../config/redis");

// POST /notifications
exports.sendNotification = async (req, res) => {
  const { userId, type, message } = req.body;
  
  if (!userId || !type || !message) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields" 
    });
  }

  try {
    // Create notification object
    const notification = {
      id: Date.now(),
      type,
      userId,
      message,
      ...req.body, // Include any additional params like email, phone, deviceToken
      timestamp: new Date().toISOString()
    };

    // Send to RabbitMQ
    await sendMessage("", notification); // Empty routing key for direct queue usage
    
    res.status(202).json({ 
      success: true, 
      message: "Notification queued successfully",
      notification
    });
  } catch (error) {
    console.error("RabbitMQ Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to queue notification"
    });
  }
};

// GET /users/:id/notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get all notifications from Redis
    const notifications = await redis.lrange('notifications', 0, -1);
    const parsedNotifications = notifications
      .map(n => JSON.parse(n))
      .filter(n => n.userId === userId);
    
    res.status(200).json(parsedNotifications);
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve notifications" 
    });
  }
};
