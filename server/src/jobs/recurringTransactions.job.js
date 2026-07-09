import cron from "node-cron";

import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";

import logger from "../config/logger/logger.js";

const recurringTransactionsJob = cron.schedule(
  "0 0 * * *", // Every day at 12:00 AM
  async () => {
    try {
      logger.info(
        "Running recurring transactions job..."
      );

      const today = new Date();

      const recurringTransactions =
        await Transaction.find({
          isRecurring: true,
          nextOccurrence: {
            $lte: today,
          },
          isDeleted: false,
        });

      for (const transaction of recurringTransactions) {
        const account =
          await Account.findById(
            transaction.account
          );

        if (!account) continue;

        await Transaction.create({
          workspace: transaction.workspace,
          account: transaction.account,
          category: transaction.category,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          transactionDate: today,
          isRecurring: false,
          parentTransaction: transaction._id,
        });

        if (transaction.type === "income") {
          account.balance += transaction.amount;
        } else {
          account.balance -= transaction.amount;
        }

        await account.save();

        switch (transaction.recurringFrequency) {
          case "daily":
            transaction.nextOccurrence.setDate(
              transaction.nextOccurrence.getDate() + 1
            );
            break;

          case "weekly":
            transaction.nextOccurrence.setDate(
              transaction.nextOccurrence.getDate() + 7
            );
            break;

          case "monthly":
            transaction.nextOccurrence.setMonth(
              transaction.nextOccurrence.getMonth() + 1
            );
            break;

          case "yearly":
            transaction.nextOccurrence.setFullYear(
              transaction.nextOccurrence.getFullYear() + 1
            );
            break;
        }

        await transaction.save();
      }

      logger.info(
        `Processed ${recurringTransactions.length} recurring transactions.`
      );
    } catch (error) {
      logger.error(
        "Recurring Transaction Job Failed",
        error
      );
    }
  },
  {
    scheduled: false,
  }
);

export default recurringTransactionsJob;