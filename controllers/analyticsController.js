const Donation = require("../models/Donation");
const User = require("../models/User");

const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    const [
      totalDonations,
      completedDonations,
      pendingDonations,
      activeNGOs,
      totalDonors,
      foodTypeDistribution,
      donorTypeDistribution,
      dailyTrends,
      monthlyTrends,
      topDonors,
    ] = await Promise.all([
      Donation.countDocuments(),
      Donation.countDocuments({ status: "completed" }),
      Donation.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "ngo" }),
      User.countDocuments({ role: "donor" }),
      Donation.aggregate([
        { $group: { _id: "$foodType", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: "donor" } },
        { $group: { _id: "$donorType", count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Donation.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.find({ role: "donor", donationCount: { $gt: 0 } })
        .sort({ points: -1 })
        .limit(5)
        .select("name points donationCount donorType"),
    ]);

    const totalMealsSaved = completedDonations * 3;

    return res.status(200).json({
      success: true,
      analytics: {
        totalDonations,
        completedDonations,
        pendingDonations,
        activeNGOs,
        totalDonors,
        totalMealsSaved,
        foodTypeDistribution,
        donorTypeDistribution,
        dailyTrends,
        monthlyTrends,
        topDonors,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };
