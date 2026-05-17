const mongoose = require('mongoose');
const User = require('./models/User');
const Donation = require('./models/Donation');

// Load environment variables directly from the same folder
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
  console.error('[Error] MONGODB_URI is not defined in your .env file! Cannot connect to MongoDB Atlas.');
  process.exit(1);
}

// Extract host securely to log verification without printing passwords
const secureHost = dbUri.includes('@') ? dbUri.split('@')[1].split('?')[0].split('/')[0] : 'localhost';
console.log(`[Sync] Connecting to MongoDB Atlas Cluster: ${secureHost}...`);

mongoose.connect(dbUri)
.then(async () => {
  console.log('[Sync] Connected successfully to MongoDB Atlas Cloud!');
  
  const users = await User.find({ role: 'donor' });
  console.log(`Found ${users.length} donors.`);
  
  for (const user of users) {
    const donations = await Donation.find({ donorId: user._id });
    const actualCount = donations.length;
    
    // Recalculate points
    let actualPoints = 0;
    for (const d of donations) {
      actualPoints += 10; // 10 points for creating
      if (d.status === 'completed') {
        actualPoints += 20; // 20 points for completing
      }
    }
    
    // Check badges
    const badges = [];
    if (actualCount >= 10) badges.push('Silver Badge');
    if (actualCount >= 50) badges.push('Gold Badge');
    if (actualCount >= 100) badges.push('Hunger Hero');
    
    if (user.donationCount !== actualCount || user.points !== actualPoints) {
      console.log(`User ${user.email}: updating count from ${user.donationCount} to ${actualCount}, points from ${user.points} to ${actualPoints}`);
      user.donationCount = actualCount;
      user.points = actualPoints;
      // We don't remove badges just in case, but we can add them
      for (const b of badges) {
        if (!user.badges.includes(b)) user.badges.push(b);
      }
      await user.save({ validateBeforeSave: false });
    }
  }
  
  console.log('Sync complete.');
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
