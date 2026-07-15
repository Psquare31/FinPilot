import cron from "node-cron";

import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

import notificationService from "../services/notification.service.js";
import emailService from "../services/email.service.js";

import logger from "../config/logger/logger.js";

const budgetAlertsJob = cron.schedule(
  "0 8 * * *", // Every day at 8:00 AM
  async () => {
    try {
      logger.info("Running budget alerts job...");

      const today = new Date();

      const budgets = await Budget.find({
        isDeleted: false,
        startDate: { $lte: today },
        endDate: { $gte: today },
      }).populate("user", "email fullName");

      for (const budget of budgets) {
        const result = await Transaction.aggregate([
          {
            $match: {
              workspace: budget.workspace,
              category: budget.category,
              type: "expense",
              isDeleted: false,
              transactionDate: {
                $gte: budget.startDate,
                $lte: budget.endDate,
              },
            },
          },
          {
            $group: {
              _id: null,
              spent: {
                $sum: "$money.amount",
              },
            },
          },
        ]);

        const spent = result[0]?.spent ?? 0;

        // `budget.amount` does not exist on the schema (it is the Money
        // subdocument `budgetAmount`), so this divided by undefined and
        // produced NaN — and `NaN < 80` is false, meaning every budget fell
        // through to firing an alert with NaN in the message.
        const percentage =
          (spent / budget.budgetAmount.amount) * 100;

        if (percentage < 80) continue;

        const title =
          percentage >= 100
            ? "Budget Exceeded"
            : "Budget Warning";

        const message =
          percentage >= 100
            ? `You have exceeded your budget "${budget.name}".`
            : `You have used ${percentage.toFixed(
                0
              )}% of your budget "${budget.name}".`;

        await notificationService.createNotification({
          workspace: budget.workspace,
          user: budget.user._id,
          title,
          message,
          type: "budget",
        });

        if (budget.user?.email) {
          await emailService.sendBudgetAlert({
            email: budget.user.email,
            budget: budget.name,
            spent,
            limit: budget.amount,
          });
        }
      }

      logger.info("Budget alerts job completed.");
    } catch (error) {
      logger.error("Budget Alert Job Failed", error);
    }
  },
  {
    scheduled: false,
  }
);

export default budgetAlertsJob;