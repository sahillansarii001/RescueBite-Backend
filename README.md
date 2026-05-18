# RescueBite Backend Server 💻

Welcome to the backend API server for **RescueBite** — a hyper-local, gamified, and real-time surplus food redistribution platform. 

This Express and Node.js application manages database mappings via Mongoose, handles JWT-based user authentication, triggers OTP verification communications via Resend SMTP, integrates Cloudinary file uploads, and structures administrative aggregations.

---

## 🚀 Key Server-Side Features

*   **Secure Authentication Flow:**
    *   Single-channel registration verification OTP emails sent via Resend SMTP with 10-minute self-expiring validation windows.
    *   3-step password recovery (Forgot Password $\rightarrow$ Verify OTP $\rightarrow$ Reset Password).
    *   JWT Token Rotation: Short-lived access tokens (15 minutes) with secure, long-lived refresh tokens (30 days) to enable secure sessions.
    *   Dedicated environment-level credential authentication bypassing standard database checks for system administrators.
*   **Surplus Food State Machine:** Enforces strict validation rules when transitioning donations between stages:
    $$\text{"pending"} \rightarrow \text{"accepted"} \rightarrow \text{"collected"} \rightarrow \text{"completed"}$$
*   **Gamification Engine & Point Pipelines:** Automatically tracks donor balances. Grants points on listings and completions, and automatically penalizes deletion cascades to prevent gamification exploitation.
*   **Manual NGO Verification Controls:** Allows admins to audit and verify NGO credentials (`isVerified = true`), which displays a verified safety badge on client-side views.
*   **Aggregate Data Analytics:** Leverages heavy MongoDB multi-stage aggregations (`$group`, `$match`, `$sort`) to construct daily/monthly trends, food type distributions, and donor leaderboard aggregates in a single request.

---

## 📁 Directory Structure Breakdown

The backend codebase is organized as follows:

```text
Server/
├── config/                         # Database initialization configurations
│   └── db.js                       # Mongoose connection bootstrapper
├── controllers/                    # Core REST API controller functions
│   ├── analyticsController.js      # MongoDB multi-stage aggregate charts pipelines
│   ├── authController.js           # Account creation, login, JWT rotation, and OTPs
│   ├── donationController.js       # Surplus food CRUD, status states, and points
│   ├── foodRequestController.js    # NGO active request postings
│   └── userController.js           # User directories, profile edits, and Admin overrides
├── middleware/                     # Express global & route-specific middleware
│   ├── authMiddleware.js           # JWT verification and Admin role guards
│   └── uploadMiddleware.js         # Multer and Cloudinary file streaming pipeline
├── models/                         # Mongoose DB Schemas & indexes
│   ├── Donation.js                 # Donation item and impact reports
│   ├── FoodRequest.js              # NGO surplus requests
│   ├── Otp.js                      # Autoreferencing TTL 10-minute OTPs
│   └── User.js                     # Users, roles, points, and milestone badges
├── routes/                         # Express routing controllers
├── server.js                       # Application entrypoint
├── sync.js                         # Database utility for mock syncs
└── utils/
    └── sendEmail.js                # NodeMailer Resend SMTP config
```

---

## 🛠️ Installation & Local Setup

### 1. Install Dependencies
Run the following command within the `/Server` directory to fetch the necessary npm packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of the `/Server` folder and populate it with the following configuration keys:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rescuebite     # Local MongoDB or cloud URL
JWT_SECRET=your_super_secure_jwt_access_secret
JWT_REFRESH_SECRET=your_super_secure_jwt_refresh_secret

# Secure Admin Direct Access Credentials
ADMIN_EMAIL=admin@rescuebite.com
ADMIN_PASSWORD=your_highly_secure_admin_password

# Resend SMTP Email Integration (OTP Deliveries)
MAIL_PASS=re_your_resend_api_key_here
FROM_EMAIL=otp@yourverifieddomain.com

# Cloudinary Integration (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 3. Launch Development Server
To launch the API server locally with automatic restart monitoring (nodemon):
```bash
npm run dev
```
The server will boot up and listen on **[http://localhost:5000](http://localhost:5000)**.

### 4. Database Seeding & Mock Data Sync
If you need to seed or synchronize your database structure with mock properties:
```bash
node sync.js
```

---

## 📊 Core Points & Gamification Formula Reference

To prevent gaming of the platform's loyalty systems, points are calculated atomicity on the server during resource deletions:
*   **Listing Added:** $+10$ points to donor, $+1$ donation count.
*   **Donation Completed:** $+20$ points to donor.
*   **Donation Deleted Cascade:**
    *   If donation was only `pending`, `accepted`, or `collected`: $-10$ points, $-1$ donation count.
    *   If donation was already `completed`: $-30$ points, $-1$ donation count.

---

## 🔗 Connected Project Documentation
*   To learn more about the technical architecture and schemas: **[Technical Requirement Document (TRD)](file:///c:/Users/ADMIN/RescueBite/docs/TRD.md)**
*   To review the product requirements and operational loops: **[Product Requirement Document (PRD)](file:///c:/Users/ADMIN/RescueBite/docs/PRD.md)**
*   To read the academic theory, points algorithms, and carbon emission models: **[Research Paper](file:///c:/Users/ADMIN/RescueBite/docs/Research_Paper.md)**
