import sendEmail from "../utils/sendEmail.js";

export const sendContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    console.log("\n📬 New Contact Message");
    console.log("─────────────────────────────────");
    console.log(`From    : ${name} <${email}>`);
    console.log(`Subject : ${subject}`);
    console.log(`Message : ${message}`);
    console.log("─────────────────────────────────\n");

    // Send email to admin
    await sendEmail({
      email: process.env.MAIL_USER || "sahilansari9967747153@gmail.com",
      subject: `RescueBite Contact: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 10px;">📬 New Contact Inquiry</h2>
          <p>You have received a new inquiry from the RescueBite contact form:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="font-weight: bold; padding: 8px 0; border-bottom: 1px solid #f0f0f0; width: 120px;">Name:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${name}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">Subject:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; border-left: 4px solid #15803d;">
            <p style="font-weight: bold; margin-top: 0; margin-bottom: 10px; color: #15803d;">Message:</p>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.5;">${message}</p>
          </div>
          <p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
            This email was generated automatically by the RescueBite platform.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: "Message received" });
  } catch (err) {
    console.error("Contact error:", err.message);
    next(err);
  }
};
