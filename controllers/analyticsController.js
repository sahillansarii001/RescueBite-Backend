import Donation from "../models/Donation.js";
import User from "../models/User.js";

export const getAnalytics = async (req, res, next) => {
  try {
    const { range = "1y" } = req.query;
    const now = new Date();
    
    let startDate = null;
    if (range === "1m") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (range === "3m") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    } else if (range === "6m") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
    } else if (range === "1y") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 12);
    }

    const donationFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const donationMatchStage = startDate ? { $match: { createdAt: { $gte: startDate } } } : { $match: {} };

    // Trends calculation variables
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const twelveMonthsAgo = startDate || new Date(now.setMonth(now.getMonth() - 12));

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
      Donation.countDocuments(donationFilter),
      Donation.countDocuments({ status: "completed", ...donationFilter }),
      Donation.countDocuments({ status: "pending", ...donationFilter }),
      User.countDocuments({ role: "ngo" }),
      User.countDocuments({ role: "donor" }),
      Donation.aggregate([
        donationMatchStage,
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

export const getPublicAnalytics = async (req, res, next) => {
  try {
    const [
      totalDonations,
      completedDonations,
      activeNGOs,
      totalDonors,
      foodTypeDistribution,
      monthlyTrends,
    ] = await Promise.all([
      Donation.countDocuments(),
      Donation.countDocuments({ status: "completed" }),
      User.countDocuments({ role: "ngo" }),
      User.countDocuments({ role: "donor" }),
      Donation.aggregate([
        { $group: { _id: "$foodType", count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

    const totalMealsSaved = completedDonations * 3;

    return res.status(200).json({
      success: true,
      analytics: {
        totalDonations,
        completedDonations,
        activeNGOs,
        totalDonors,
        totalMealsSaved,
        foodTypeDistribution,
        monthlyTrends,
      },
    });
  } catch (err) {
    next(err);
  }
};
