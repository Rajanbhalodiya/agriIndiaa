import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  // If connection is already established, reuse it (crucial for Vercel Serverless)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI environment variable is missing!");
    if (!isVercel) {
      // Local development fallback
      try {
        await mongoose.connect("mongodb://127.0.0.1:27017/agriindia");
        console.log("Database Connected (Local Fallback)");
        return;
      } catch (fallbackErr) {
        console.error("Local MongoDB connection failed:", fallbackErr.message);
      }
    }
    return;
  }

  try {
    const dbName = uri.includes("/agriindia") ? "" : "/agriindia";
    await mongoose.connect(`${uri}${dbName}`);
    isConnected = true;
    console.log("Database Connected Successfully");

    // Clean legacy index if needed
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.collection('advisors').dropIndex('email_1');
      }
    } catch (indexErr) {
      // Legacy index might not exist
    }
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    if (!isVercel) {
      try {
        console.log("Trying local fallback...");
        await mongoose.connect("mongodb://127.0.0.1:27017/agriindia");
        console.log("Database Connected (Local Fallback)");
      } catch (localErr) {
        console.error("Local MongoDB Fallback Failed:", localErr.message);
      }
    }
  }
};

export default connectDB;