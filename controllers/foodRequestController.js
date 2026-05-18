const FoodRequest = require('../models/FoodRequest');
const User = require('../models/User');

const createRequest = async (req, res, next) => {
  try {
    const { quantityNeeded } = req.body;
    if (!quantityNeeded) return res.status(400).json({ success: false, message: 'Quantity is required' });

    const user = await User.findById(req.user.userId);
    if (!user || (user.role === 'ngo' && !user.isVerified)) {
      return res.status(403).json({ success: false, message: 'Your NGO account is pending admin verification.' });
    }

    const request = await FoodRequest.create({
      ngoId: req.user.userId,
      quantityNeeded
    });

    return res.status(201).json({ success: true, request });
  } catch (err) { next(err); }
};

const getActiveRequests = async (req, res, next) => {
  try {
    const requests = await FoodRequest.find({ status: 'active' })
      .populate('ngoId', 'name location email phone address mapLink')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) { next(err); }
};

const getMyRequests = async (req, res, next) => {
  try {
    const requests = await FoodRequest.find({ ngoId: req.user.userId })
      .populate('fulfilledBy', 'name email phone donorType location address mapLink')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) { next(err); }
};

const acceptRequest = async (req, res, next) => {
  try {
    const { prepTime } = req.body;
    if (!prepTime) {
      return res.status(400).json({ success: false, message: 'Preparation time is required' });
    }

    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Request is no longer active' });
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    request.collectOtp = otpCode;
    request.status = 'accepted';
    request.fulfilledBy = req.user.userId;
    request.prepTime = prepTime;
    await request.save();

    const donor = await User.findById(req.user.userId);
    const ngo = await User.findById(request.ngoId);

    if (donor && ngo) {
      const sendEmail = require('../utils/sendEmail');
      if (process.env.OAUTH_REFRESH_TOKEN || process.env.MAIL_PASS) {
        try {
          await sendEmail({
            email: donor.email,
            subject: 'RescueBite - Food Request Collection Verification Code',
            message: `The NGO ${ngo.name} is ready to collect the food request. Please share this 6-digit OTP code with them to verify collection: ${otpCode}`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #15803d; text-align: center;">Food Request Collection OTP</h2>
                    <p style="font-size: 16px; color: #475569;">Hello ${donor.name},</p>
                    <p style="font-size: 16px; color: #475569;">You have accepted the food request from NGO <strong>${ngo.name}</strong>.</p>
                    <p style="font-size: 16px; color: #475569;">Please share this 6-digit one-time password (OTP) with them when they collect the food request:</p>
                    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #15803d;">${otpCode}</span>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">This OTP code ensures that only authorized NGOs collect your fulfilled food request.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Thank you for your generous contribution to RescueBite.</p>
                   </div>`
          });
        } catch (emailErr) {
          console.error('Failed to send request collection OTP email on acceptance:', emailErr);
        }
      } else {
        console.log(`\n\n=== REQUEST COLLECTION OTP EMAIL BYPASSED ===\nTo Donor: ${donor.email}\nNGO: ${ngo.name}\nOTP: ${otpCode}\n=======================================\n\n`);
      }
    }

    const populated = await FoodRequest.findById(request._id)
      .populate('ngoId', 'name email phone location address mapLink')
      .populate('fulfilledBy', 'name email phone location address mapLink donorType');

    return res.status(200).json({ success: true, request: populated });
  } catch (err) { next(err); }
};

const markPrepared = async (req, res, next) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.fulfilledBy.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the donor who fulfilled this request can mark it as prepared.' });
    }
    if (request.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted requests can be marked as prepared.' });
    }

    request.status = 'prepared';
    await request.save();

    const ngo = await User.findById(request.ngoId);
    const donor = await User.findById(req.user.userId);
    if (ngo && donor) {
      const sendEmail = require('../utils/sendEmail');
      if (process.env.OAUTH_REFRESH_TOKEN || process.env.MAIL_PASS) {
        try {
          await sendEmail({
            email: ngo.email,
            subject: 'RescueBite - Food Ready for Collection!',
            message: `Hello ${ngo.name}, the food request you posted is now prepared and ready for collection at ${donor.name}.`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #15803d; text-align: center;">Food Ready for Collection!</h2>
                    <p style="font-size: 16px; color: #475569;">Hello ${ngo.name},</p>
                    <p style="font-size: 16px; color: #475569;">We have great news! The donor <strong>${donor.name}</strong> has prepared the food for the request you made.</p>
                    <p style="font-size: 16px; color: #475569;">It is now ready to be collected. When you arrive at the restaurant, please verify collection with them.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Thank you for your dedication to rescue food with RescueBite!</p>
                   </div>`
          });
        } catch (emailErr) {
          console.error('Failed to send food prepared notification email to NGO:', emailErr);
        }
      } else {
        console.log(`\n\n=== FOOD PREPARED EMAIL BYPASSED ===\nTo NGO: ${ngo.email}\nDonor: ${donor.name}\n=======================================\n\n`);
      }
    }

    const populated = await FoodRequest.findById(request._id)
      .populate('ngoId', 'name email phone location address mapLink')
      .populate('fulfilledBy', 'name email phone location address mapLink donorType');

    return res.status(200).json({ success: true, request: populated });
  } catch (err) { next(err); }
};

const sendRequestCollectOtp = async (req, res, next) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const { userId, role } = req.user;
    if (role !== 'ngo' || request.ngoId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the NGO who created this request can request a collection OTP.' });
    }

    if (request.status !== 'accepted' && request.status !== 'prepared') {
      return res.status(400).json({ success: false, message: 'OTP can only be requested for accepted or prepared requests.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    request.collectOtp = otpCode;
    await request.save();

    const donor = await User.findById(request.fulfilledBy);
    const ngo = await User.findById(userId);

    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found for this request.' });

    const sendEmail = require('../utils/sendEmail');
    if (process.env.OAUTH_REFRESH_TOKEN || process.env.MAIL_PASS) {
      try {
        await sendEmail({
          email: donor.email,
          subject: 'RescueBite - Food Request Collection Verification Code',
          message: `The NGO ${ngo.name} is ready to collect the food request. Please share this 6-digit OTP code with them to verify collection: ${otpCode}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #15803d; text-align: center;">Food Request Collection OTP</h2>
                  <p style="font-size: 16px; color: #475569;">Hello ${donor.name},</p>
                  <p style="font-size: 16px; color: #475569;">The NGO <strong>${ngo.name}</strong> is at your location and ready to collect the food request.</p>
                  <p style="font-size: 16px; color: #475569;">Please verify and share this 6-digit one-time password (OTP) with them to confirm the collection:</p>
                  <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #15803d;">${otpCode}</span>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">This OTP code ensures that only authorized NGOs collect your fulfilled food request.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center;">Thank you for your generous contribution to RescueBite.</p>
                 </div>`
        });
      } catch (emailErr) {
        console.error('Failed to send request collection OTP email:', emailErr);
        return res.status(500).json({ success: false, message: 'Failed to send OTP email to donor.' });
      }
    } else {
      console.log(`\n\n=== REQUEST COLLECTION OTP EMAIL BYPASSED ===\nTo Donor: ${donor.email}\nNGO: ${ngo.name}\nOTP: ${otpCode}\n=======================================\n\n`);
    }

    return res.status(200).json({ success: true, message: 'Verification OTP sent to donor email!' });
  } catch (err) { next(err); }
};

const collectRequest = async (req, res, next) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const { userId, role } = req.user;
    if (role !== 'ngo' || request.ngoId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the NGO who created this request can verify collection.' });
    }

    if (request.status !== 'accepted' && request.status !== 'prepared') {
      return res.status(400).json({ success: false, message: 'Only accepted or prepared requests can be collected' });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Verification OTP is required to mark as collected' });
    }
    if (request.collectOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired collection OTP code.' });
    }

    request.collectOtp = null;
    request.status = 'collected';
    await request.save();

    const populated = await FoodRequest.findById(request._id)
      .populate('ngoId', 'name email phone location address mapLink')
      .populate('fulfilledBy', 'name email phone location address mapLink donorType');

    return res.status(200).json({ success: true, request: populated });
  } catch (err) { next(err); }
};

const completeRequest = async (req, res, next) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const { userId, role } = req.user;
    if (role !== 'ngo' || request.ngoId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the NGO who created this request can complete it.' });
    }

    if (request.status !== 'collected') {
      return res.status(400).json({ success: false, message: 'Only collected requests can be completed' });
    }

    const { peopleFed, usedLocation, description } = req.body;
    request.impactDetails = {
      peopleFed: Number(peopleFed) || 0,
      usedLocation: usedLocation || '',
      description: description || '',
      submitted: true
    };

    request.status = 'completed';
    request.completedAt = Date.now();
    await request.save();

    const donor = await User.findById(request.fulfilledBy);
    if (donor) {
      donor.points += 20;
      await donor.save();
    }

    const populated = await FoodRequest.findById(request._id)
      .populate('ngoId', 'name email phone location address mapLink')
      .populate('fulfilledBy', 'name email phone location address mapLink donorType');

    return res.status(200).json({ success: true, request: populated });
  } catch (err) { next(err); }
};

const getDonorAcceptedRequests = async (req, res, next) => {
  try {
    const requests = await FoodRequest.find({ 
      fulfilledBy: req.user.userId,
      status: { $in: ['accepted', 'prepared', 'collected', 'completed'] }
    })
      .populate('ngoId', 'name email phone location address mapLink')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) { next(err); }
};

const getAllRequests = async (req, res, next) => {
  try {
    const requests = await FoodRequest.find()
      .populate('ngoId', 'name location email phone address mapLink')
      .populate('fulfilledBy', 'name email phone location address mapLink donorType')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) { next(err); }
};

const deleteRequest = async (req, res, next) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (req.user.role !== 'admin' && request.ngoId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await request.deleteOne();
    return res.status(200).json({ success: true, message: 'Request deleted successfully' });
  } catch (err) { next(err); }
};

module.exports = { 
  createRequest, 
  getActiveRequests, 
  getMyRequests, 
  acceptRequest, 
  markPrepared,
  sendRequestCollectOtp, 
  collectRequest, 
  completeRequest, 
  getDonorAcceptedRequests, 
  getAllRequests, 
  deleteRequest 
};
