const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { 
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
} = require('../controllers/foodRequestController');

router.post('/', protect, restrictTo('ngo'), createRequest);
router.get('/my-requests', protect, restrictTo('ngo'), getMyRequests);
router.get('/active', protect, restrictTo('donor', 'admin'), getActiveRequests);
router.get('/donor-accepted', protect, restrictTo('donor'), getDonorAcceptedRequests);
router.get('/', protect, restrictTo('admin'), getAllRequests);
router.put('/:id/accept', protect, restrictTo('donor'), acceptRequest);
router.put('/:id/prepared', protect, restrictTo('donor'), markPrepared);
router.post('/:id/send-collect-otp', protect, restrictTo('ngo'), sendRequestCollectOtp);
router.put('/:id/collect', protect, restrictTo('ngo'), collectRequest);
router.put('/:id/complete', protect, restrictTo('ngo'), completeRequest);
router.delete('/:id', protect, restrictTo('ngo', 'admin'), deleteRequest);

module.exports = router;
