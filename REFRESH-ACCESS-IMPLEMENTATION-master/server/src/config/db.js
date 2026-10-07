import mongoose from "mongoose";
import config from "./config.js";

async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("MONGODB - connected");
  } catch (error) {
    console.error("MONGODB - NOT-connected:", error.message);
  }
}

export default connectDB;
