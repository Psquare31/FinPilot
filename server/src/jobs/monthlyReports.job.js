import cron from "node-cron";

import Workspace from "../models/Workspace.js";

import reportService from "../services/report.service.js";
import notificationService from "../services/notification.service.js";
import emailService from "../services/email.service.js";

import logger from "../config/logger/logger.js";

const monthlyReportsJob = cron.schedule(
  "0 1 1 * *", // 1 AM on the 1st of every month
  async () => {
    try {
      logger.info("Running monthly reports job...");

      const workspaces = await Workspace.find({
        isDeleted: false,
      }).populate("owner", "email fullName");

      const now = new Date();

      const year = now.getFullYear();

      const month = now.getMonth();

      for (const workspace of workspaces) {
        const report =
          await reportService.generateMonthlyReport(
            workspace._id,
            month,
            year
          );

        await notificationService.createNotification({
          workspace: workspace._id,
          user: workspace.owner._id,
          title: "Monthly Report Ready",
          message:
            "Your monthly financial report has been generated.",
          type: "report",
        });

        if (workspace.owner?.email) {
          await emailService.sendMonthlyReport({
            email: workspace.owner.email,
            reportUrl: report.downloadUrl,
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