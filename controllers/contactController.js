// ── DEV MODE ──────────────────────────────────────────────────────────────────
// Messages are logged to the server console for testing.
// To enable real email, replace the console.log block with nodemailer sendMail
// calls and set MAIL_USER / MAIL_PASS (Gmail App Password) in .env
// ─────────────────────────────────────────────────────────────────────────────

const sendContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    console.log('\n📬 New Contact Message');
    console.log('─────────────────────────────────');
    console.log(`From    : ${name} <${email}>`);
    console.log(`Subject : ${subject}`);
    console.log(`Message : ${message}`);
    console.log('─────────────────────────────────\n');

    return res.status(200).json({ success: true, message: 'Message received' });
  } catch (err) {
    console.error('Contact error:', err.message);
    next(err);
  }
};

module.exports = { sendContact };
