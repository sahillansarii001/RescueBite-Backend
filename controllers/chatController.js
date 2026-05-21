const RESCUEBITE_KNOWLEDGE = `
=== RESCUEBITE PLATFORM — COMPLETE KNOWLEDGE BASE ===

## 1. What is RescueBite?
RescueBite is a food rescue and redistribution platform that connects food donors (restaurants, hotels, caterers, individuals) with NGOs to redirect surplus food to people in need. The goal is to reduce food waste and fight hunger simultaneously.

## 2. User Roles
There are THREE user roles on the platform:

### Donor (role: "donor")
- Can be an **individual** or a **restaurant/business** (donorType field).
- Donates surplus food by creating donation listings with food name, quantity, expiry time, pickup address, and an optional photo.
- Earns **points** for completed donations (10 points per donation completion).
- Can accept **NGO Food Requests** — when an NGO posts a request for food, donors can volunteer to fulfill it.
- Appears on the **Leaderboard** ranked by points.
- Has a profile with: name, email, phone, location, address, mapLink, profilePic, donorType.

### NGO (role: "ngo")
- Non-governmental organizations that collect and distribute food to beneficiaries.
- Must upload a **verification document** (registration certificate) which the admin reviews.
- Has an **isVerified** flag — only verified NGOs can accept donations and post food requests.
- Can **accept donations** from donors (changing donation status from "pending" to "accepted").
- Can **post Food Requests** asking donors to prepare specific quantities of food.
- After collecting food, submits **impact details** (peopleFed, usedLocation, description).
- Has fields: name, email, phone, location, address, mapLink, websiteLink, ngoDocument, isVerified, profilePic.

### Admin (role: "admin")
- Full platform control from the Admin Dashboard.
- Can view all users, donations, food requests, and analytics.
- Can create, edit, delete any user.
- Can **verify** or **reject** NGO registration documents.
- Can reset user passwords.
- Can delete donations and food requests.
- Accesses the Analytics dashboard with charts and trends.
- Has access to this AI chatbot assistant.

## 3. Donation Workflow
A donation goes through these statuses:

1. **pending** — Donor creates a donation listing (foodName, quantity, expiry, description, pickupAddress, photo). The donation is visible to all verified NGOs.
2. **accepted** — A verified NGO accepts the donation. An OTP code is generated and emailed to the donor for secure handoff verification. The NGO's details are linked to the donation.
3. **collected** — When the NGO physically arrives to collect the food, they enter the OTP code the donor received. This verifies the collection. The donation status moves to "collected".
4. **completed** — The NGO submits **impact details** (how many people were fed, where the food was used, description). The donor earns **10 points**. The donation is marked complete.

Key details:
- Each donation has: foodName, quantity, expiry, description, pickupAddress, pickupMapLink, foodImage, status, donorId, acceptedBy (NGO), collectOtp, impactDetails, completedAt.
- The **collectOtp** is a 6-digit code for secure verification during collection.
- OTP can be re-sent via the "send-collect-otp" endpoint.

## 4. NGO Food Request Workflow
NGOs can proactively request food from donors:

1. **active** — NGO creates a food request specifying quantityNeeded. It appears in the donor feed.
2. **accepted** — A donor accepts the request and specifies **prepTime** (preparation time). An OTP is generated and emailed to the donor.
3. **prepared** — The donor marks the food as prepared. The NGO is notified via email that food is ready for collection.
4. **collected** — The NGO arrives and enters the OTP code to verify collection.
5. **completed** — The NGO submits impact details (peopleFed, usedLocation, description). The donor earns **20 points**.

Key details:
- Each request has: ngoId, quantityNeeded, status, fulfilledBy (donor), prepTime, collectOtp, impactDetails, completedAt.
- Only verified NGOs can create food requests.
- Only donors can accept and prepare food requests.

## 5. NGO Verification Process
- When an NGO registers, they can upload a registration/verification document (PDF or image).
- The document is stored via **Cloudinary** (cloud image/file hosting).
- The admin reviews the document in the **NGO Verification** tab of the admin dashboard.
- Admin can:
  - **Verify**: Sets isVerified=true, sends a congratulatory email to the NGO with a link to their dashboard.
  - **Reject**: Sets isVerified=false, clears the ngoDocument, sends a rejection email asking them to re-upload a valid document.
- Unverified NGOs cannot accept donations or create food requests — they see a "pending verification" message.

## 6. Points & Gamification
- Donors earn points for helping:
  - **10 points** per completed donation
  - **20 points** per completed food request fulfillment
- Points contribute to the **Leaderboard** (top 10 donors ranked by points).
- Donors also have a **donationCount** tracking total donations.
- Badges system exists in the schema (array field) for future expansion.

## 7. Email Notifications
The platform sends automated emails for:
- OTP verification during registration (6-digit code)
- Password reset (forgot password flow with OTP)
- Donation collection OTP (sent to donor when NGO accepts)
- Food request collection OTP (sent to donor when they accept a request)
- Food prepared notification (sent to NGO when donor marks food as prepared)
- NGO verification success email (congratulatory, with dashboard link)
- NGO rejection email (with re-upload instructions)
- Contact form submissions (forwarded to admin)
- Newsletter subscriptions (forwarded to admin)

## 8. Authentication System
- **JWT-based** authentication with access tokens and refresh tokens.
- Access tokens expire in 15 minutes; refresh tokens expire in 7 days.
- Registration requires email OTP verification before account creation.
- Forgot password flow: send OTP → verify OTP → reset password.
- Passwords are hashed with **bcryptjs** (10 salt rounds).
- Protected routes use the **protect** middleware (verifies JWT).
- Role-based access uses the **restrictTo** middleware.

## 9. Technical Architecture
- **Backend**: Node.js + Express.js server with ES Modules.
- **Database**: MongoDB with Mongoose ODM.
- **Frontend**: Next.js (React) client application.
- **File uploads**: Cloudinary via Multer middleware.
- **Email**: Nodemailer with either OAuth2 (Gmail) or SMTP transport.
- **Real-time**: Server-Sent Events (SSE) for live registration broadcasts.
- **API Base**: All endpoints under /api/ prefix.

### API Routes:
- **/api/auth** — register, login, logout, refresh, OTP, password reset, file upload
- **/api/users** — profile, leaderboard, nearest counterparts, admin CRUD, SSE stream, NGO verify/reject
- **/api/donations** — CRUD, status updates, impact details, collection OTP
- **/api/requests** — food request CRUD, accept, prepare, collect, complete, OTP
- **/api/analytics** — admin-only analytics data
- **/api/contact** — contact form submission
- **/api/newsletter** — newsletter subscription
- **/api/chat** — this chatbot endpoint

## 10. Nearest Feature
- Donors can find the nearest verified NGOs, and NGOs can find the nearest donors.
- Uses **Haversine formula** for distance calculation based on coordinates extracted from Google Maps links.
- Falls back to known Mumbai locations if coordinates can't be parsed.

## 11. Admin Dashboard Tabs
The admin dashboard has these sections:
- **Overview** — Stat cards showing total users, donors, NGOs, donations by status
- **Analytics** — Charts and visual analytics
- **Users** — Full user management (CRUD, search, filter by role, bulk delete)
- **NGO Verification** — Review and verify/reject NGO documents
- **Donations** — All donations with status filters, bulk actions
- **NGO Requests** — All food requests from NGOs
- **Profile** — Admin's own profile settings
- **Security** — Password change

=== END KNOWLEDGE BASE ===
`;

const buildSystemInstruction = (context) => {
  return `You are **RescueBite Assistant**, an expert AI chatbot for the RescueBite Admin Panel. You have deep, comprehensive knowledge of every aspect of the RescueBite food rescue platform.

${RESCUEBITE_KNOWLEDGE}

## Your Capabilities
You can answer questions about the RescueBite project, including:
- Platform statistics and live data analysis
- How features work (donations, food requests, NGO verification, etc.)
- Workflow explanations (step-by-step processes)
- User role explanations and permissions
- Technical architecture and API endpoints
- Troubleshooting common issues

## Response Guidelines
1. Be extremely concise, direct, and to the point. DO NOT give unprompted extra information, bullet lists of statistics, lists of features, or suggested questions unless specifically asked.
2. For simple greetings (like 'hi', 'hello', 'hii', 'hey', 'good morning'), reply ONLY with a simple one-sentence greeting: "Hello! I am your RescueBite Assistant. How can I help you today?" and absolutely nothing else. Do NOT include statistics, instructions, workflows, tutorials, or suggestions in this greeting.
3. CRITICAL RESTRICTION: You must STRICTLY REFUSE to answer any question that is not related to the RescueBite project, food rescue, or the provided context. If the user asks a general knowledge, coding, math, general chat, or unrelated question, you must reply exactly with: "I'm sorry, but I am strictly programmed to assist only with the RescueBite platform and cannot answer questions outside of this scope."
4. When answering data questions, reference the live Context data provided below.
5. Use clean markdown formatting: **bold**, *italics*, lists where appropriate.
6. Do not offer unsolicited tips, warnings, or detailed technical explanations unless the user specifically asks for technical details.
7. CRITICAL SECURITY RESTRICTION: If the user asks for environment variables (.env), PRD, TRD, architectural documents, secret credentials, passwords, API keys, or any internal administrative documents, you MUST pretend you do not have access to them. You MUST reply exactly with: "I do not have access to internal documents, environment variables, or secret credentials."

## Current Live Platform Data
${JSON.stringify(context || {}, null, 2)}`;
};

const buildDemoReply = (message, context) => {
  const summary = context?.summary || {};
  const recentD = context?.recentDonations || [];
  const recentR = context?.recentRequests || [];
  const userList = context?.userDetails || [];
  const lowerMsg = message.toLowerCase();

  // --- Security / Internal Documents ---
  if (lowerMsg.includes("env") || lowerMsg.includes("prd") || lowerMsg.includes("trd") || lowerMsg.includes("credential") || lowerMsg.includes("password") || lowerMsg.includes("api key") || lowerMsg.includes("secret")) {
    return "I do not have access to internal documents, environment variables, or secret credentials.";
  }

  // --- Platform overview / status ---
  if (lowerMsg.includes("summarize") || lowerMsg.includes("status") || lowerMsg.includes("overview") || lowerMsg.includes("dashboard")) {
    return `### 📊 RescueBite Platform Summary
Here is a summary of the current platform metrics:
- **Total Users:** ${summary.totalUsers || 0} (${summary.donors || 0} Donors, ${summary.ngos || 0} NGOs)
- **Donation Statuses:** ${summary.totalDonations || 0} total
  - ⏳ **Pending:** ${summary.pendingDonations || 0}
  - ✅ **Completed:** ${summary.completedDonations || 0}
  - 🤝 **Accepted:** ${summary.acceptedDonations || 0}
  - 🚚 **Collected:** ${summary.collectedDonations || 0}
- **NGO Food Requests:** ${summary.totalFoodRequests || 0} total
  - 🟢 **Active:** ${summary.activeRequests || 0}
  - ⏳ **Pending:** ${summary.pendingRequests || 0}
- **Unverified NGOs:** ${summary.unverifiedNgos || 0} pending verification

*Running in Demo Mode — add \`GEMINI_API_KEY\` to \`Server/.env\` for full AI capabilities.*`;
  }

  // --- Donation questions ---
  if (lowerMsg.includes("donation")) {
    const pendingText = summary.pendingDonations > 0
      ? `We currently have **${summary.pendingDonations} pending donations** awaiting NGO acceptance.`
      : `All donations have been matched or completed!`;

    let listText = recentD.length > 0
      ? recentD.map(d => `- **${d.foodName}** (${d.quantity}) — Status: *${d.status}* by *${d.donorName}*`).join("\n")
      : "No recent donations found.";

    return `### 🍎 Donation Report
${pendingText}

**Recent Donations:**
${listText}

**Donation Workflow:** pending → accepted (NGO picks up) → collected (OTP verified) → completed (impact submitted, donor earns 10 pts)

*Running in Demo Mode — add \`GEMINI_API_KEY\` for full AI chat.*`;
  }

  // --- NGO / verification ---
  if (lowerMsg.includes("verify") || lowerMsg.includes("ngo") || lowerMsg.includes("verification")) {
    return `### 🏢 NGO & Verification Status
- **Total NGOs registered:** ${summary.ngos || 0}
- **Verified NGOs:** ${summary.verifiedNgos || 0}
- **Awaiting verification:** ${summary.unverifiedNgos || 0}

**How to verify an NGO:**
1. Go to the **NGO Verification** tab in the admin dashboard.
2. Review the uploaded registration document.
3. Click **Verify** to approve or **Reject** to ask for re-upload.
4. The NGO receives an email notification of the decision.

**Why it matters:** Only verified NGOs can accept donations and post food requests.

*Running in Demo Mode — add \`GEMINI_API_KEY\` for full AI chat.*`;
  }

  // --- Food requests ---
  if (lowerMsg.includes("request") || lowerMsg.includes("food request")) {
    return `### 📋 NGO Food Requests
- **Total Requests:** ${summary.totalFoodRequests || 0}
- **Active (open):** ${summary.activeRequests || 0}
- **Pending:** ${summary.pendingRequests || 0}

${recentR.length > 0 ? "**Recent Requests:**\n" + recentR.map(r => `- **${r.ngoName}** — ${r.quantity || "N/A"} qty — Status: *${r.status}*`).join("\n") : ""}

**Request Workflow:** active → accepted (donor volunteers) → prepared → collected (OTP verified) → completed (impact submitted, donor earns 20 pts)

*Running in Demo Mode — add \`GEMINI_API_KEY\` for full AI chat.*`;
  }

  // --- How does X work ---
  if (lowerMsg.includes("how") && (lowerMsg.includes("work") || lowerMsg.includes("does"))) {
    if (lowerMsg.includes("otp") || lowerMsg.includes("collect")) {
      return `### 🔐 OTP Collection Verification
When an NGO accepts a donation (or a donor accepts a food request), a **6-digit OTP code** is generated and emailed to the donor.

**Process:**
1. NGO/Donor accepts the listing → OTP generated & emailed to donor
2. When the NGO arrives to collect food, the donor shares the OTP
3. The NGO enters the OTP in the app to verify collection
4. Status moves to "collected"

This ensures **only authorized parties** complete the handoff. The OTP can be re-sent if needed.

*Running in Demo Mode.*`;
    }
    if (lowerMsg.includes("point") || lowerMsg.includes("leaderboard") || lowerMsg.includes("gamif")) {
      return `### 🏆 Points & Leaderboard
- Donors earn **10 points** per completed donation
- Donors earn **20 points** per completed food request fulfillment
- The **Leaderboard** shows the top 10 donors ranked by points
- This gamification encourages consistent participation

*Running in Demo Mode.*`;
    }
    return `### ℹ️ How RescueBite Works
RescueBite connects **food donors** with **NGOs** to rescue surplus food:

1. **Donors** list surplus food (name, quantity, expiry, photo, pickup address)
2. **Verified NGOs** accept donations and collect them with OTP verification
3. **Impact tracking** — NGOs report how many people were fed
4. **Gamification** — Donors earn points, appear on leaderboard

**For admins**, you can manage all users, verify NGOs, track donations, and view analytics.

Try asking something specific like "How does donation collection work?" or "How to verify an NGO?"

*Running in Demo Mode.*`;
  }

  // --- Users ---
  if (lowerMsg.includes("user") || lowerMsg.includes("donor") || lowerMsg.includes("leaderboard")) {
    return `### 👥 User Overview
- **Total Users:** ${summary.totalUsers || 0}
- **Donors:** ${summary.donors || 0}
- **NGOs:** ${summary.ngos || 0} (${summary.verifiedNgos || 0} verified, ${summary.unverifiedNgos || 0} pending)

**User Roles:**
- **Donors** — Create food donations, accept NGO requests, earn points
- **NGOs** — Accept donations, post food requests, submit impact reports
- **Admin** — Full platform control, user management, analytics

**Admin Actions:** You can create, edit, delete users, reset passwords, and verify/reject NGOs from the Users and NGO Verification tabs.

*Running in Demo Mode.*`;
  }

  // --- Points / gamification ---
  if (lowerMsg.includes("point") || lowerMsg.includes("score") || lowerMsg.includes("gamif") || lowerMsg.includes("badge")) {
    return `### 🏆 Points & Gamification System
- **10 points** — awarded to donor when a donation is completed
- **20 points** — awarded to donor when a food request is fulfilled
- **Leaderboard** — Top 10 donors ranked by total points
- **Badges** — Schema supports badges (array field) for future expansion

This system motivates donors to contribute consistently to the platform.

*Running in Demo Mode.*`;
  }

  // --- Technical / architecture ---
  if (lowerMsg.includes("tech") || lowerMsg.includes("stack") || lowerMsg.includes("architect") || lowerMsg.includes("api") || lowerMsg.includes("endpoint")) {
    return `### 🛠️ Technical Architecture
- **Backend:** Node.js + Express.js (ES Modules)
- **Database:** MongoDB + Mongoose
- **Frontend:** Next.js (React)
- **File Storage:** Cloudinary
- **Auth:** JWT (access + refresh tokens) + bcryptjs
- **Email:** Nodemailer (OAuth2 or SMTP)
- **Real-time:** Server-Sent Events (SSE)

**API Routes:**
- \`/api/auth\` — Registration, login, OTP, password reset
- \`/api/users\` — Profiles, leaderboard, admin CRUD, NGO verify
- \`/api/donations\` — Donation CRUD, status updates, OTP
- \`/api/requests\` — Food request lifecycle
- \`/api/analytics\` — Dashboard analytics
- \`/api/contact\` — Contact form
- \`/api/newsletter\` — Subscriptions
- \`/api/chat\` — This chatbot

*Running in Demo Mode.*`;
  }

  // --- Help / default ---
  return `Hello! 👋 I'm the **RescueBite Admin Assistant** — I can answer **any question** about the platform!

**Live Stats:**
- **${summary.totalUsers || 0}** registered users (${summary.donors || 0} donors, ${summary.ngos || 0} NGOs)
- **${summary.pendingDonations || 0}** pending donations
- **${summary.unverifiedNgos || 0}** NGOs awaiting verification
- **${summary.totalFoodRequests || 0}** food requests

**Try asking me:**
- *"How does the donation workflow work?"*
- *"Summarize platform status"*
- *"How do I verify an NGO?"*
- *"How does OTP collection work?"*
- *"What's the points system?"*
- *"Show technical architecture"*
- *"List pending donations"*
- *"How do food requests work?"*

*Running in Demo Mode — add \`GEMINI_API_KEY\` to \`Server/.env\` for full conversational AI.*`;
};

const handleChat = async (req, res) => {
  const { message, history, context } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    const reply = buildDemoReply(message, context);
    return res.status(200).json({ success: true, reply });
  }

  try {
    const contents = [];

    // Map history to Gemini format
    if (Array.isArray(history)) {
      history.forEach((turn) => {
        const role =
          turn.role === "assistant" || turn.role === "bot" || turn.role === "model"
            ? "model"
            : "user";
        contents.push({
          role: role,
          parts: [{ text: turn.text || turn.content || "" }],
        });
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const systemInstructionText = buildSystemInstruction(context);

    // Call Gemini API using official SDK
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemInstructionText,
    });

    let reply = "I'm sorry, I couldn't generate a response.";
    try {
      const result = await model.generateContent({
        contents: contents,
      });
      reply = result.response.text();
    } catch (apiError) {
      console.error("Gemini SDK Error:", apiError);
      return res.status(500).json({
        success: false,
        message: apiError.message || "Gemini API returned an error",
      });
    }

    return res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error("Chat controller error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default handleChat;
