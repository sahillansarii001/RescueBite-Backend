const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Log config to help diagnose issues in production
  console.log(`[sendEmail] Attempting to send via Resend to: ${options.email}`);
  console.log(`[sendEmail] RESEND_API_KEY configured: ${!!process.env.RESEND_API_KEY}`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY,
    },
  });

  // NOTE: On Resend Free Tier, you MUST use 'onboarding@resend.dev' as the 'from' address
  // unless you verify your own domain in the Resend dashboard.
  const mailOptions = {
    from: 'RescueBite <onboarding@resend.dev>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendEmail] Email sent successfully. MessageId: ${info.messageId}`);
  } catch (err) {
    console.error(`[sendEmail] FAILED to send email via Resend.`);
    console.error(`[sendEmail] Error message: ${err.message}`);
    // Re-throw so the controller can handle it
    throw err;
  }
};

module.exports = sendEmail;
