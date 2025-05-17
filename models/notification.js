const { v4: uuidv4 } = require('uuid');
const notifications = [];

class Notification {
  constructor(userId, type, message) {
    this.id = uuidv4();
    this.userId = userId;
    this.type = type;
    this.message = message;
    this.timestamp = new Date();
    notifications.push(this);
  }

  static getByUserId(userId) {
    return notifications.filter(n => n.userId === userId);
  }
}

module.exports = Notification;
