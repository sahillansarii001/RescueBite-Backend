const Donation = require('../models/Donation');
const User = require('../models/User');

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
      .populate('acceptedBy', 'name email')
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
      .populate('acceptedBy', 'name email');

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
      if (current !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending donations can be accepted' });
      }
      donation.acceptedBy = userId;
    } else if (status === 'collected') {
      if (role !== 'ngo') {
        return res.status(403).json({ success: false, message: 'Only NGOs can mark as collected' });
      }
      if (current !== 'accepted') {
        return res.status(400).json({ success: false, message: 'Only accepted donations can be collected' });
      }
      if (!donation.acceptedBy || donation.acceptedBy.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Only the NGO who accepted can collect' });
      }
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
      .populate('acceptedBy', 'name email');

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

    await donation.deleteOne();

    return res.status(200).json({ success: true, message: 'Donation deleted' });
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
};
