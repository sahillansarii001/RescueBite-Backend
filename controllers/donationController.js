const Donation = require('../models/Donation');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const createDonation = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { foodName, quantity, foodType, expiryTime, location, description, isRecurring } = req.body;
    const image = req.file?.path || '';
    // FormData sends booleans as strings — normalize
    const isRecurringBool = isRecurring === true || isRecurring === 'true';

    const donation = await Donation.create({
      foodName,
      quantity,
      foodType,
      expiryTime,
      location,
      description,
      isRecurring: isRecurringBool,
      image,
      donorId: userId,
    });

    const user = await User.findById(userId);
    user.donationCount += 1;
    user.points += 10;

    if (user.donationCount >= 10 && !user.badges.includes('Silver Badge')) {
      user.badges.push('Silver Badge');
    }
    if (user.donationCount >= 50 && !user.badges.includes('Gold Badge')) {
      user.badges.push('Gold Badge');
    }
    if (user.donationCount >= 100 && !user.badges.includes('Hunger Hero')) {
      user.badges.push('Hunger Hero');
    }

    await user.save();

    // Find all verified NGOs
    const verifiedNgos = await User.find({ role: 'ngo', isVerified: true });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');

    // Send email notification to each verified NGO
    for (const ngo of verifiedNgos) {
      try {
        await sendEmail({
          email: ngo.email,
          subject: '🍲 New Food Donation Available!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #c8e6c9; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <h2 style="color: #2e7d32; margin-top: 0;">New Food Donation Available on RescueBite!</h2>
              <p>Hello <strong>${ngo.name}</strong>,</p>
              <p>A new food donation has just been uploaded and is ready for collection:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f1f8e9;">
                  <td style="padding: 10px; font-weight: bold; border: 1px solid #dcedc8; width: 120px;">Food Item:</td>
                  <td style="padding: 10px; border: 1px solid #dcedc8;">${foodName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; border: 1px solid #dcedc8;">Quantity:</td>
                  <td style="padding: 10px; border: 1px solid #dcedc8;">${quantity}</td>
                </tr>
                <tr style="background-color: #f1f8e9;">
                  <td style="padding: 10px; font-weight: bold; border: 1px solid #dcedc8;">Location:</td>
                  <td style="padding: 10px; border: 1px solid #dcedc8;">${location}</td>
                </tr>
                ${description ? `
                <tr>
                  <td style="padding: 10px; font-weight: bold; border: 1px solid #dcedc8;">Description:</td>
                  <td style="padding: 10px; border: 1px solid #dcedc8;">${description}</td>
                </tr>` : ''}
              </table>
              <p>Please log in to your RescueBite dashboard to accept this donation before it is claimed or expires.</p>
              <p style="margin-top: 25px;"><a href="${clientUrl}/login" style="background-color: #2e7d32; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(46,125,50,0.2);">Go to Dashboard</a></p>
              <hr style="border: 0; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
              <p style="font-size: 11px; color: #757575;">This is an automated notification from RescueBite. Please do not reply to this email.</p>
            </div>
          `
        });
      } catch (mailErr) {
        console.error(`Failed to send donation email to NGO ${ngo.email}:`, mailErr);
      }
    }

    return res.status(201).json({
      success: true,
      donation,
      user: { points: user.points, badges: user.badges, donationCount: user.donationCount },
    });
  } catch (err) {
    next(err);
  }
};

const getAllDonations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.donorId) filter.donorId = req.query.donorId;
    if (req.query.acceptedBy) filter.acceptedBy = req.query.acceptedBy;

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email donorType location')
      .populate('acceptedBy', 'name email phone location address mapLink')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: donations.length, donations });
  } catch (err) {
    next(err);
  }
};

const getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email donorType location')
      .populate('acceptedBy', 'name email phone location address mapLink');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    return res.status(200).json({ success: true, donation });
  } catch (err) {
    next(err);
  }
};

const updateDonationStatus = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const { status } = req.body;
    const { userId, role } = req.user;
    const current = donation.status;

    // Validate transitions
    if (status === 'accepted') {
      if (role !== 'ngo') {
        return res.status(403).json({ success: false, message: 'Only NGOs can accept donations' });
      }

      // Check if NGO is verified
      const user = await User.findById(userId);
      if (!user || !user.isVerified) {
        return res.status(403).json({ success: false, message: 'Your NGO account is pending admin verification.' });
      }

      if (current !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending donations can be accepted' });
      }
      donation.acceptedBy = userId;
    } else if (status === 'collected') {
      if (role !== 'ngo') {
        return res.status(403).json({ success: false, message: 'Only NGOs can mark as collected' });
      }

      // Check if NGO is verified
      const user = await User.findById(userId);
      if (!user || !user.isVerified) {
        return res.status(403).json({ success: false, message: 'Your NGO account is pending admin verification.' });
      }

      if (current !== 'accepted') {
        return res.status(400).json({ success: false, message: 'Only accepted donations can be collected' });
      }
      if (!donation.acceptedBy || donation.acceptedBy.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Only the NGO who accepted can collect' });
      }

      // Verify OTP!
      const { otp } = req.body;
      if (!otp) {
        return res.status(400).json({ success: false, message: 'Verification OTP is required to mark as collected' });
      }
      if (donation.collectOtp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid or expired collection OTP. Please ask the donor for the correct code.' });
      }

      // Clear the collection OTP once verified
      donation.collectOtp = null;
    } else if (status === 'completed') {
      if (role !== 'ngo') {
        return res.status(403).json({ success: false, message: 'Only NGOs can complete donations' });
      }
      if (current !== 'collected') {
        return res.status(400).json({ success: false, message: 'Only collected donations can be completed' });
      }
      const donor = await User.findById(donation.donorId);
      if (donor) {
        donor.points += 20;
        await donor.save();
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    donation.status = status;
    await donation.save();

    // Return populated donation
    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email donorType location')
      .populate('acceptedBy', 'name email phone location address mapLink');

    return res.status(200).json({ success: true, donation: populated });
  } catch (err) {
    next(err);
  }
};

const deleteDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (req.user.userId !== donation.donorId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Subtract points and count from donor
    const donor = await User.findById(donation.donorId);
    if (donor) {
      let pointsToSubtract = 10; // Creation points
      if (donation.status === 'completed') pointsToSubtract += 20; // Completion bonus
      
      console.log(`Deducting ${pointsToSubtract} points from donor ${donor.email}. Status was ${donation.status}`);
      
      donor.points = Math.max(0, (donor.points || 0) - pointsToSubtract);
      donor.donationCount = Math.max(0, (donor.donationCount || 0) - 1);
      await donor.save({ validateBeforeSave: false });
    }

    await donation.deleteOne();

    return res.status(200).json({ success: true, message: 'Donation deleted' });
  } catch (err) {
    next(err);
  }
};

const addImpactDetails = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    
    if (donation.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed donations can have impact details' });
    }
    
    if (req.user.role !== 'ngo' || !donation.acceptedBy || donation.acceptedBy.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the NGO who accepted this donation can submit impact details' });
    }

    const { peopleFed, usedLocation, description } = req.body;
    donation.impactDetails = {
      peopleFed: Number(peopleFed) || 0,
      usedLocation: usedLocation || '',
      description: description || '',
      submitted: true
    };
    
    await donation.save();
    
    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email donorType location')
      .populate('acceptedBy', 'name email phone location address mapLink');
      
    return res.status(200).json({ success: true, donation: populated, message: 'Impact details added successfully' });
  } catch (err) {
    next(err);
  }
};

const sendCollectOtp = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const { userId, role } = req.user;
    if (role !== 'ngo' || !donation.acceptedBy || donation.acceptedBy.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the NGO who accepted this donation can request a collection OTP.' });
    }

    // Check if the NGO is verified
    const ngo = await User.findById(userId);
    if (!ngo || !ngo.isVerified) {
      return res.status(403).json({ success: false, message: 'Your NGO account is pending admin verification.' });
    }

    if (donation.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'OTP can only be sent for accepted donations.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    donation.collectOtp = otpCode;
    await donation.save();

    const donor = await User.findById(donation.donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found for this donation.' });
    }

    if (process.env.OAUTH_REFRESH_TOKEN || process.env.MAIL_PASS) {
      try {
        await sendEmail({
          email: donor.email,
          subject: 'RescueBite - Food Collection Verification Code',
          message: `The NGO ${ngo.name} is ready to collect the food donation "${donation.foodName}". Please share this 6-digit OTP code with them to verify collection: ${otpCode}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #15803d; text-align: center;">Food Collection OTP</h2>
                  <p style="font-size: 16px; color: #475569;">Hello ${donor.name},</p>
                  <p style="font-size: 16px; color: #475569;">The NGO <strong>${ngo.name}</strong> is at your location and ready to collect the food donation <strong>"${donation.foodName}"</strong>.</p>
                  <p style="font-size: 16px; color: #475569;">Please verify and share this 6-digit one-time password (OTP) with them to confirm the collection:</p>
                  <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #15803d;">${otpCode}</span>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">This OTP code ensures that only authorized NGOs collect your donated food.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center;">Thank you for your generous contribution to RescueBite.</p>
                 </div>`
        });
      } catch (emailErr) {
        console.error('Failed to send collection OTP email:', emailErr);
        return res.status(500).json({ success: false, message: 'Failed to send OTP email to donor.' });
      }
    } else {
      console.log(`\n\n=== COLLECTION OTP EMAIL BYPASSED ===\nTo Donor: ${donor.email}\nNGO: ${ngo.name}\nOTP: ${otpCode}\n=======================================\n\n`);
    }

    return res.status(200).json({ success: true, message: 'Verification OTP sent to donor email!' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDonation,
  getAllDonations,
  getDonationById,
  updateDonationStatus,
  deleteDonation,
  addImpactDetails,
  sendCollectOtp,
};
