import mongoose from "mongoose";

import env from "../env/index.js";
import logger from "../logger/logger.js";

// Surface the offending field/value on Mongoose strict-query issues
// instead of silently dropping them.
mongoose.set("strictQuery", true);

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        return mongoose.connection;
    }

    try {
        const conn = await mongoose.connect(env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            autoIndex: !env.isProduction,
        });

        isConnected = true;

        logger.info(
            `✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
        );

        console.log("Connected DB:", mongoose.connection.name);
        console.log("Host:", mongoose.connection.host);

        return conn.connection;
    } catch (error) {
        logger.error(`❌ MongoDB connection failed: ${error.message}`);
        throw error;
    }
};

// ======================================================
// Connection lifecycle logging
// ======================================================

mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("⚠️  MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
    isConnected = true;
    logger.info("🔄 MongoDB reconnected.");
});

mongoose.connection.on("error", (error) => {
    logger.error(`MongoDB connection error: ${error.message}`);
});

export const disconnectDB = async () => {
    if (!isConnected) return;

    await mongoose.connection.close();
    isConnected = false;
    logger.info("MongoDB connection closed.");
};

export default connectDB;
