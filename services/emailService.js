const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.send = async (userEmail, message) => {
  try {
    console.log(
      `[emailService] Sending email to ${userEmail} with message: "${message}"`
    );
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Notification",
      text: message,
    });
    console.log(`[emailService] Email sent: ${info.messageId}`);
  } catch (error) {
    console.error(`[emailService] Error sending email to ${userEmail}:`, error);
    throw error; // Rethrow error so the worker can handle retry or fail properly
  }
};
