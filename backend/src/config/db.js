import mongoose from "mongoose";
import logger from "./logger.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "newDB",
    });

    logger.info({ host: conn.connection.host }, "MongoDB connected");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection error");
    process.exit(1); 
  }
};
