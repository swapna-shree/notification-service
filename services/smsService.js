const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

exports.send = async (to, message) => {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: to // recipient's phone number
  });
};