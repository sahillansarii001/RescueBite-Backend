const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donation = require('../models/Donation');
const sendEmail = require('../utils/sendEmail');

const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await User.find({ role: 'donor' })
      .sort({ points: -1 })
      .limit(10)
      .select('name points badges donationCount donorType');
    return res.status(200).json({ success: true, leaderboard });
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, location, language, donorType, phone, address } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = email;
    }

    if (name) user.name = name;
    if (location) user.location = location;
    if (language) user.language = language;
    if (donorType) user.donorType = donorType;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (req.body.websiteLink !== undefined) user.websiteLink = req.body.websiteLink;
    if (req.body.ngoDocument !== undefined) user.ngoDocument = req.body.ngoDocument;
    if (req.file && req.file.path) user.profilePic = req.file.path;
    await user.save({ validateBeforeSave: false });
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ success: true, user: userObj });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json({ success: true, users });
  } catch (err) { next(err); }
};

// Admin: create a user manually
const adminCreateUser = async (req, res, next) => {
  try {
    const { name, email, password, role, location, address, mapLink, phone, language, donorType } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password || 'rescuebite123', 10);
    const userData = { name, email, password: hashedPassword, role, location, address, mapLink, phone, language };
    if (role === 'donor') userData.donorType = donorType || 'individual';
    const user = await User.create(userData);
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(201).json({ success: true, user: userObj });
  } catch (err) { next(err); }
};

// Admin: delete a user and their donations
const adminDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts' });
    await Donation.deleteMany({ donorId: user._id });
    await user.deleteOne();
    return res.status(200).json({ success: true, message: 'User and their donations deleted' });
  } catch (err) { next(err); }
};

// Admin: update any user's role, points, or basic info
const adminUpdateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { name, email, role, points, location, address, phone, donorType } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && role !== 'admin') user.role = role;
    if (points !== undefined) user.points = Number(points);
    if (location) user.location = location;
    if (address) user.address = address;
    if (phone) user.phone = phone;
    if (donorType) user.donorType = donorType;
    await user.save({ validateBeforeSave: false });
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ success: true, user: userObj });
  } catch (err) { next(err); }
};

// Admin: reset a user's password
const adminResetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

// Admin: get a single user with their donations
const adminGetUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const donations = await Donation.find({ donorId: user._id }).sort({ createdAt: -1 }).limit(20);
    return res.status(200).json({ success: true, user, donations });
  } catch (err) { next(err); }
};

// Admin: verify an NGO
const adminVerifyNgo = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'ngo') return res.status(400).json({ success: false, message: 'Only NGOs can be verified' });
    
    user.isVerified = !user.isVerified; // toggle
    await user.save({ validateBeforeSave: false });
    
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');

    // Send successful verification email if activated
    if (user.isVerified) {
      try {
        await sendEmail({
          email: user.email,
          subject: '🎉 Congratulations! Your NGO Account Has Been Verified!',
          message: `Dear ${user.name},\n\nWe are absolutely thrilled to inform you that your NGO account on RescueBite has been verified successfully by our administration team!\n\nYou now have full administrative clearance to accept food donations, post food requests, and track your organization's direct community impact.\n\nThank you for partner-programming with RescueBite to reduce waste and fight hunger.\n\nBest regards,\nThe RescueBite Team`,
          html: `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f8fafc; border-radius: 24px; border: 1px solid #e2e8f0; color: #1e293b;">
              <!-- Header Brand -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #15803d, #166534); border-radius: 12px; color: #ffffff; font-weight: 800; font-size: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; margin-bottom: 8px;">R</div>
                <h1 style="font-size: 24px; font-weight: 900; color: #14532d; margin: 0; tracking: -0.025em;">RescueBite</h1>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #166534; font-weight: 700; margin: 2px 0 0 0;">Food Security Platform</p>
              </div>

              <!-- Main Card -->
              <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <h2 style="font-size: 20px; font-weight: 800; color: #1e293b; margin-top: 0; margin-bottom: 16px; text-align: center; background: linear-gradient(135deg, #15803d, #16a34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🎉 Verification Successful!</h2>
                
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 16px;">Dear <strong>${user.name}</strong>,</p>
                
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">We are absolutely thrilled to inform you that your RescueBite NGO account has been **verified successfully** by our administration team!</p>
                
                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="font-size: 13px; font-weight: 700; color: #14532d; margin: 0 0 4px 0;">🔓 Features Unlocked for Your Organization:</p>
                  <ul style="font-size: 12px; color: #166534; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>Accept available food donations from local restaurants in real-time.</li>
                    <li>Post customized NGO Food Requests directly to our global donor feeds.</li>
                    <li>Record and trace your organization's positive direct community impact points.</li>
                  </ul>
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">You can now log in to your RescueBite NGO Dashboard and immediately begin serving families in need.</p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${clientUrl}/login" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s ease;">
                    Access NGO Dashboard
                  </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 11px; line-height: 1.5; color: #94a3b8; margin: 0; text-align: center;">
                  Thank you for partner-programming with RescueBite to reduce food waste and feed our communities.<br />
                  If you have any questions, please contact our support team at <a href="mailto:support@rescuebite.com" style="color: #16a34a; text-decoration: none; font-weight: 600;">support@rescuebite.com</a>.
                </p>
              </div>

              <!-- Footer -->
              <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">
                © 2026 RescueBite Platform. All rights reserved.
              </p>
            </div>
          `
        });
      } catch (err) {
        console.error('Failed to send NGO verification confirmation email:', err);
      }
    }
    
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ success: true, user: userObj, message: user.isVerified ? 'NGO verified' : 'NGO verification removed' });
  } catch (err) { next(err); }
};

// Admin: reject an NGO (clear document & set unverified, notifying them via email)
const adminRejectNgo = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'ngo') return res.status(400).json({ success: false, message: 'Only NGOs can be rejected' });
    
    user.isVerified = false;
    user.ngoDocument = null; // clear uploaded document
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');

    // Send rejection email to the NGO
    try {
      await sendEmail({
        email: user.email,
        subject: '⚠️ Notice: NGO Verification Document Rejected',
        message: `Dear ${user.name},\n\nWe are writing to inform you that your uploaded NGO registration document on RescueBite was reviewed by our administration team and unfortunately has been rejected.\n\nTo complete your NGO verification, please log in to your dashboard and upload a valid, clearly readable registration document.\n\nIf you have any questions, please reach out to support@rescuebite.com.\n\nBest regards,\nThe RescueBite Team`,
        html: `
          <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fffafb; border-radius: 24px; border: 1px solid #fee2e2; color: #1e293b;">
            <!-- Header Brand -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 12px; color: #ffffff; font-weight: 800; font-size: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; margin-bottom: 8px;">R</div>
              <h1 style="font-size: 24px; font-weight: 900; color: #7f1d1d; margin: 0; tracking: -0.025em;">RescueBite</h1>
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #b91c1c; font-weight: 700; margin: 2px 0 0 0;">Food Security Platform</p>
            </div>

            <!-- Main Card -->
            <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #fee2e2; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <h2 style="font-size: 20px; font-weight: 800; color: #dc2626; margin-top: 0; margin-bottom: 16px; text-align: center;">⚠️ Document Verification Rejected</h2>
              
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 16px;">Dear <strong>${user.name}</strong>,</p>
              
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">We are writing to inform you that your uploaded NGO registration / verification document was reviewed by our team and unfortunately has been **rejected**.</p>
              
              <div style="background-color: #fff5f5; border-left: 4px solid #f87171; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 13px; font-weight: 700; color: #991b1b; margin: 0 0 4px 0;">📋 Next Steps Required:</p>
                <p style="font-size: 12px; color: #b91c1c; margin: 0; line-height: 1.6;">
                  Your uploaded file has been cleared from our database. To proceed with unlocking your account, please log in to your RescueBite dashboard and upload a valid, clearly readable registration document (PDF or Image).
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${clientUrl}/login" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #b91c1c); color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4); text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s ease;">
                  Log In & Re-Upload Document
                </a>
              </div>

              <hr style="border: 0; border-top: 1px solid #fee2e2; margin: 24px 0;" />
              <p style="font-size: 11px; line-height: 1.5; color: #94a3b8; margin: 0; text-align: center;">
                If you believe this was an error or have questions about the upload requirements, please contact our support team at <a href="mailto:support@rescuebite.com" style="color: #dc2626; text-decoration: none; font-weight: 600;">support@rescuebite.com</a>.
              </p>
            </div>

            <!-- Footer -->
            <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">
              © 2026 RescueBite Platform. All rights reserved.
            </p>
          </div>
        `
      });
    } catch (err) {
      console.error('Failed to send NGO rejection email:', err);
    }

    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ success: true, user: userObj, message: 'NGO verification document rejected and reset successfully' });
  } catch (err) { next(err); }
};

module.exports = {
  getLeaderboard, getProfile, updateProfile, changePassword, getAllUsers,
  adminCreateUser, adminDeleteUser, adminUpdateUser, adminResetPassword, adminGetUser, adminVerifyNgo, adminRejectNgo,
};
