const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createRequest, getActiveRequests, getMyRequests, fulfillRequest, getAllRequests, deleteRequest } = require('../controllers/foodRequestController');

router.post('/', protect, restrictTo('ngo'), createRequest);
router.get('/my-requests', protect, restrictTo('ngo'), getMyRequests);
router.get('/active', protect, restrictTo('donor', 'admin'), getActiveRequests);
router.get('/', protect, restrictTo('admin'), getAllRequests);
router.put('/:id/fulfill', protect, restrictTo('donor'), fulfillRequest);
router.delete('/:id', protect, restrictTo('ngo', 'admin'), deleteRequest);

module.exports = router;
