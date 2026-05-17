const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Log config to help diagnose issues in production
  console.log(`[sendEmail] Attempting to send via Gmail to: ${options.email}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `RescueBite <${process.env.MAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendEmail] Email sent successfully. MessageId: ${info.messageId}`);
  } catch (err) {
    console.error(`[sendEmail] FAILED to send email via Gmail.`);
    console.error(`[sendEmail] Error message: ${err.message}`);
    // Re-throw so the controller can handle it
    throw err;
  }
};

module.exports = sendEmail;
