import cron from "node-cron";

import Investment from "../models/Investment.js";

import notificationService from "../services/notification.service.js";
import emailService from "../services/email.service.js";

import logger from "../config/logger/logger.js";

const investmentReminderJob = cron.schedule(
  "0 10 * * *", // Every day at 10 AM
  async () => {
    try {
      logger.info("Running investment reminder job...");

      const today = new Date();

      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);

      const investments = await Investment.find({
        isDeleted: false,
        status: "active",
        nextInvestmentDate: {
          $lte: sevenDaysLater,
        },
      }).populate("user", "email fullName");

      for (const investment of investments) {
        const title = "Upcoming Investment Reminder";

        const message = `Your investment "${investment.name}" is scheduled on ${investment.nextInvestmentDate.toDateString()}.`;

        await notificationService.createNotification({
          workspace: investment.workspace,
          user: investment.user._id,
          title,
          message,
          type: "investment",
        });

        if (investment.user?.email) {
          await emailService.sendNotification({
            email: investment.user.email,
            title,
            message,
          });
        }
      }

      logger.info("Investment reminder job completed.");
    } catch (error) {
      logger.error(
        "Investment Reminder Job Failed",
        error
      );
    }
  },
  {
    scheduled: false,
  }
);

export default investmentReminderJob;