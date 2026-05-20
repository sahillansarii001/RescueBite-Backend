import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const dump = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");

    const users = await User.find({}).select('name role email location address mapLink isVerified');
    console.log("Total users in database:", users.length);
    console.log(JSON.stringify(users, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error dumping database:", err);
  }
};

dump();
