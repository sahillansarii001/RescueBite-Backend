const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createRequest, getActiveRequests, getMyRequests, fulfillRequest } = require('../controllers/foodRequestController');

router.post('/', protect, restrictTo('ngo'), createRequest);
router.get('/my-requests', protect, restrictTo('ngo'), getMyRequests);
router.get('/active', protect, restrictTo('donor', 'admin'), getActiveRequests);
router.put('/:id/fulfill', protect, restrictTo('donor'), fulfillRequest);

module.exports = router;
