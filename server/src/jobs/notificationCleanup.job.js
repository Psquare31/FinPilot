import cron from "node-cron";

import Notification from "../models/Notification.js";

import logger from "../config/logger/logger.js";

const notificationCleanupJob = cron.schedule(
  "0 3 * * 0", // Every Sunday at 3 AM
  async () => {
    try {
      logger.info(
        "Running notification cleanup job..."
      );

      const ninetyDaysAgo = new Date();

      ninetyDaysAgo.setDate(
        ninetyDaysAgo.getDate() - 90
      );

      const result =
        await Notification.deleteMany({
          createdAt: {
            $lt: ninetyDaysAgo,
          },
          isDeleted: true,
        });

      logger.info(
        `Deleted ${result.deletedCount} old notifications.`
      );
    } catch (error) {
      logger.error(
        "Notification Cleanup Job Failed",
        error
      );
    }
  },
  {
    scheduled: false,
  }
);

export default notificationCleanupJob;