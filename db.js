const mongoose = require("mongoose");

module.exports = async function connectDB() {
  try {
    const mongoURL = process.env.MONGO_URL || "mongodb://localhost:27017/saas";

    await mongoose.connect(mongoURL);

    console.log("MongoDB connecté");
  } catch (err) {
    console.log("Erreur MongoDB:", err);
  }
};