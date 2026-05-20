import sendEmail from "../utils/sendEmail.js";

export const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please enter a valid email address",
        });
    }

    console.log("\n📰 New Newsletter Subscription");
    console.log("─────────────────────────────────");
    console.log(`Subscriber Email: ${email}`);
    console.log("─────────────────────────────────\n");

    // Get current time in IST
    const istTimeStr = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "medium",
    });

    // Send email to admin
    await sendEmail({
      email: process.env.MAIL_USER || "sahilansari9967747153@gmail.com",
      subject: `RescueBite Newsletter: New Subscription from ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 10px;">📰 New Newsletter Subscription</h2>
          <p>A new visitor has subscribed to the RescueBite newsletter:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="font-weight: bold; padding: 8px 0; border-bottom: 1px solid #f0f0f0; width: 150px;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">Subscription Time:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${istTimeStr} (IST)</td>
            </tr>
          </table>
          <p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
            This email was generated automatically by the RescueBite platform.
          </p>
        </div>
      `,
    });

    return res
      .status(200)
      .json({ success: true, message: "Successfully subscribed" });
  } catch (err) {
    console.error("Newsletter subscription error:", err.message);
    next(err);
  }
};
