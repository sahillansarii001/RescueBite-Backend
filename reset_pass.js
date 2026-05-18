const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "c:/Users/ADMIN/RescueBite/Server/.env" });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await mongoose
    .model("User", new mongoose.Schema({}, { strict: false }))
    .findOneAndUpdate(
      { email: "sahillansarii001@gmail.com" },
      { password: hashedPassword },
      { new: true },
    );

  if (user) {
    console.log(
      "Successfully reset password for donor sahillansarii001@gmail.com to '123456'!",
    );
  } else {
    console.log("Could not find user with email 'sahillansarii001@gmail.com'");
  }
  process.exit(0);
}

run().catch(console.error);
