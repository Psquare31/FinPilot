import cron from "node-cron";

import Workspace from "../models/Workspace.js";

import reportService from "../services/report.service.js";
import notificationService from "../services/notification.service.js";
import emailService from "../services/email.service.js";
import env from "../config/env/index.js";

import logger from "../config/logger/logger.js";

const monthlyReportsJob = cron.schedule(
  "0 1 1 * *", // 1 AM on the 1st of every month
  async () => {
    try {
      logger.info("Running monthly reports job...");

      const workspaces = await Workspace.find({
        status: "active",
      }).populate("owner", "email fullName");

      const now = new Date();

      // Report for the month that just ended.
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1;

      for (const workspace of workspaces) {
        await reportService.generateMonthlyReport(
          workspace._id,
          year,
          month
        );

        await notificationService.createNotification({
          workspace: workspace._id,
          user: workspace.owner._id,
          title: "Monthly Report Ready",
          message:
            "Your monthly financial report has been generated.",
          type: "system",
        });

        if (workspace.owner?.email) {
          await emailService.sendMonthlyReport({
            email: workspace.owner.email,
            reportUrl: `${env.CLIENT_URL}/reports`,
          });
        }
      }

      logger.info("Monthly reports generated.");
    } catch (error) {
      logger.error(
        "Monthly Report Job Failed",
        error
      );
    }
  },
  {
    scheduled: false,
  }
);

export default monthlyReportsJob;