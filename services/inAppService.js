const { emitToUser } = require('../utils/websocket');
exports.send = async (userId, message) => {
  emitToUser(userId, message);
};
