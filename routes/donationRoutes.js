const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/upload');
const {
  createDonation,
  getAllDonations,
  getDonationById,
  updateDonationStatus,
  deleteDonation,
  addImpactDetails,
  sendCollectOtp,
} = require('../controllers/donationController');

router.post('/', protect, uploadSingle, createDonation);
router.get('/', getAllDonations);
router.get('/:id', getDonationById);
router.put('/:id', protect, updateDonationStatus);
router.put('/:id/impact', protect, addImpactDetails);
router.delete('/:id', protect, deleteDonation);
router.post('/:id/send-collect-otp', protect, sendCollectOtp);

module.exports = router;
