const { v4: uuidv4 } = require('uuid');

class Notification {
  constructor(userId, type, message) {
    this.id = uuidv4();
    this.userId = userId;
    this.type = type;
    this.message = message;
    this.timestamp = new Date();
  }
}

module.exports = Notification;
