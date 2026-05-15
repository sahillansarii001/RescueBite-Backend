const FoodRequest = require('../models/FoodRequest');

const createRequest = async (req, res, next) => {
  try {
    const { quantityNeeded } = req.body;
    if (!quantityNeeded) return res.status(400).json({ success: false, message: 'Quantity is required' });

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
      .populate('ngoId', 'name location email phone')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) { next(err); }
};

const getMyRequests = async (req, res, next) => {
  try {
    const requests = await FoodRequest.find({ ngoId: req.user.userId })
      .populate('fulfilledBy', 'name email phone donorType')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) { next(err); }
};

const fulfillRequest = async (req, res, next) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'active') return res.status(400).json({ success: false, message: 'Request is no longer active' });

    request.status = 'fulfilled';
    request.fulfilledBy = req.user.userId;
    await request.save();

    return res.status(200).json({ success: true, request });
  } catch (err) { next(err); }
};

module.exports = { createRequest, getActiveRequests, getMyRequests, fulfillRequest };
