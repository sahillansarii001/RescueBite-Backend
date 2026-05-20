import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
  const senderEmail =
    process.env.MAIL_USER || "sahilansari9967747153@gmail.com";

  // Log config to help diagnose issues in production
  console.log(`[sendEmail] Attempting to send to: ${options.email}`);

  // Option A: Use Gmail API (HTTPS over port 443) if OAuth credentials are provided
  // This is highly recommended in cloud environments like Render to bypass SMTP blocks
  if (refreshToken && clientId && clientSecret) {
    console.log(`[sendEmail] Using Gmail HTTP API (OAuth2 over port 443)`);
    try {
      // 1. Refresh Access Token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Failed to refresh Google OAuth token: ${errText}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // 2. Construct MIME message (RFC 822)
      const utf8Subject = `=?utf-8?B?${Buffer.from(options.subject).toString("base64")}?=`;
      const emailParts = [
        `From: RescueBite <${senderEmail}>`,
        `To: ${options.email}`,
        `Subject: ${utf8Subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(options.html || options.message).toString("base64"),
      ];
      const emailStr = emailParts.join("\r\n");
      const base64SafeEmail = Buffer.from(emailStr)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // 3. POST to Gmail API
      const sendResponse = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: base64SafeEmail,
          }),
        },
      );

      if (!sendResponse.ok) {
        const errText = await sendResponse.text();
        throw new Error(`Gmail API send failed: ${errText}`);
      }

      const sendData = await sendResponse.json();
      console.log(
        `[sendEmail] Email sent successfully via Gmail API. ID: ${sendData.id}`,
      );
      return;
    } catch (err) {
      console.error(
        `[sendEmail] Gmail API (OAuth2) FAILED. Falling back to SMTP if available.`,
      );
      console.error(`[sendEmail] OAuth Error: ${err.message}`);
      // Fall through to SMTP if we have SMTP credentials as fallback, else throw
      if (!process.env.MAIL_PASS) {
        throw err;
      }
    }
  }

  // Option B: Fallback to SMTP
  console.log(`[sendEmail] Using SMTP Transporter fallback (port 587)`);
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: senderEmail,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `RescueBite <${senderEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[sendEmail] Email sent successfully via SMTP. MessageId: ${info.messageId}`,
    );
  } catch (err) {
    console.error(`[sendEmail] SMTP FAILED to send email.`);
    console.error(`[sendEmail] SMTP Error: ${err.message}`);
    throw err;
  }
};

export default sendEmail;
