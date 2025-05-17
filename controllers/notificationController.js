const Notification = require('../models/notification');
const notificationQueue = require('../queues/notificationQueue');

exports.sendNotification = async (req, res) => {
  const { userId, type, message } = req.body;
  if (!userId || !type || !message)
    return res.status(400).json({ error: 'Missing fields' });

  const notification = new Notification(userId, type, message);
  await notificationQueue.add('send', notification);

  res.status(200).json({ message: 'Notification queued' });
};

exports.getUserNotifications = async (req, res) => {
  const userId = req.params.id;
  const notifications = Notification.getByUserId(userId);
  res.status(200).json(notifications);
};
