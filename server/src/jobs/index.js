import recurringTransactionsJob from "./recurringTransactions.job.js";
import budgetAlertsJob from "./budgetAlerts.job.js";
import monthlyReportsJob from "./monthlyReports.job.js";
import goalReminderJob from "./goalReminder.job.js";
import investmentReminderJob from "./investmentReminder.job.js";
import notificationCleanupJob from "./notificationCleanup.job.js";

export const initializeJobs = () => {
  recurringTransactionsJob.start();
  budgetAlertsJob.start();
  monthlyReportsJob.start();
  goalReminderJob.start();
  investmentReminderJob.start();
  notificationCleanupJob.start();

  console.log("All Scheduled Jobs Started");
};