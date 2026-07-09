import cron from "node-cron";

import Goal from "../models/Goal.js";

import notificationService from "../services/notification.service.js";
import emailService from "../services/email.service.js";

import logger from "../config/logger/logger.js";

const goalReminderJob = cron.schedule(
  "0 9 * * *", // Every day at 9 AM
  async () => {
    try {
      logger.info("Running goal reminder job...");

      const today = new Date();

      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);

      const goals = await Goal.find({
        isDeleted: false,
        status: {
          $ne: "completed",
        },
      }).populate("user", "email fullName");

      for (const goal of goals) {
        if (!goal.targetDate) continue;

        const progress =
          (goal.currentAmount / goal.targetAmount) *
          100;

        let title = "";
        let message = "";

        if (progress >= 100) {
          title = "Goal Achieved 🎉";

          message = `Congratulations! You achieved your goal "${goal.name}".`;
        } else if (
          goal.targetDate <= sevenDaysLater
        ) {
          title = "Goal Deadline Approaching";

          message = `Your goal "${goal.name}" is due within 7 days.`;
        } else {
          continue;
        }

        await notificationService.createNotification({
          workspace: goal.workspace,
          user: goal.user._id,
          title,
          message,
          type: "goal",
        });

        if (goal.user?.email) {
          await emailService.sendNotification({
            email: goal.user.email,
            title,
            message,
          });
        }
      }

      logger.info("Goal reminder job completed.");
    } catch (error) {
      logger.error("Goal Reminder Job Failed", error);
    }
  },
  {
    scheduled: false,
  }
);

export default goalReminderJob;