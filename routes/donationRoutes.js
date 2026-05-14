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
} = require('../controllers/donationController');

router.post('/', protect, uploadSingle, createDonation);
router.get('/', getAllDonations);
router.get('/:id', getDonationById);
router.put('/:id', protect, updateDonationStatus);
router.delete('/:id', protect, deleteDonation);

module.exports = router;
