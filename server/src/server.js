import app from "./app.js";
import env from "./config/env/index.js";
import logger from "./config/logger/logger.js";
import connectDB, { disconnectDB } from "./config/database/connectDB.js";
import { initializeJobs } from "./jobs/index.js";

let server;

const startServer = async () => {
    try {
        await connectDB();
        await initializeJobs();

        server = app.listen(env.PORT, () => {
            logger.info(
                `🚀 FinPilot API running in ${env.NODE_ENV} mode on port ${env.PORT}`
            );
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

const shutdown = async (signal) => {
    logger.warn(`${signal} received. Shutting down gracefully...`);

    if (server) {
        server.close(async () => {
            await disconnectDB();
            logger.info("HTTP server closed. Bye 👋");
            process.exit(0);
        });

        // Force-exit if shutdown hangs.
        setTimeout(() => process.exit(1), 10000).unref();
    } else {
        await disconnectDB();
        process.exit(0);
    }
};

process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    shutdown("uncaughtException");
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
