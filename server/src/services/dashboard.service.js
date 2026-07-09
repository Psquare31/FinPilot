import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import Debt from "../models/Debt.js";
import Investment from "../models/Investment.js";

import cacheService from "./cache.service.js";
import { REDIS_KEYS } from "../config/redis/redisKeys.js";

class DashboardService {
  // Get complete dashboard with Redis caching
  async getDashboard(workspace) {
    const cacheKey = REDIS_KEYS.DASHBOARD(workspace);

    const cachedDashboard = await cacheService.get(cacheKey);

    if (cachedDashboard) {
      return cachedDashboard;
    }

    const [
      accountSummary,
      transactionSummary,
      budgetSummary,
      goalSummary,
      debtSummary,
      investmentSummary,
      recentTransactions,
    ] = await Promise.all([
      this.getAccountSummary(workspace),
      this.getTransactionSummary(workspace),
      this.getBudgetSummary(workspace),
      this.getGoalSummary(workspace),
      this.getDebtSummary(workspace),
      this.getInvestmentSummary(workspace),
      this.getRecentTransactions(workspace),
    ]);

    const dashboard = {
      accounts: accountSummary,
      transactions: transactionSummary,
      budgets: budgetSummary,
      goals: goalSummary,
      debts: debtSummary,
      investments: investmentSummary,
      recentTransactions,
    };

    await cacheService.set(
      cacheKey,
      dashboard,
      300 // Cache for 5 minutes
    );

    return dashboard;
  }

  // Get account summary
  async getAccountSummary(workspace) {
    const accounts = await Account.find({
      workspace,
      isArchived: false,
      isDeleted: false,
    }).lean();

    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    return {
      totalAccounts: accounts.length,
      totalBalance,
      accounts,
    };
  }

  // Get transaction summary
  async getTransactionSummary(workspace) {
    const summary = await Transaction.aggregate([
      {
        $match: {
          workspace,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$type",
          total: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const income =
      summary.find((item) => item._id === "income")?.total ?? 0;

    const expense =
      summary.find((item) => item._id === "expense")?.total ?? 0;

    return {
      income,
      expense,
      cashFlow: income - expense,
    };
  }

  // Get budget summary
  async getBudgetSummary(workspace) {
    const budgets = await Budget.find({
      workspace,
      isArchived: false,
      isDeleted: false,
    }).lean();

    return {
      totalBudgets: budgets.length,
      budgets,
    };
  }

  // Get goal summary
  async getGoalSummary(workspace) {
    const goals = await Goal.find({
      workspace,
      isArchived: false,
      isDeleted: false,
    }).lean();

    const completedGoals = goals.filter(
      (goal) => goal.status === "completed"
    ).length;

    return {
      totalGoals: goals.length,
      completedGoals,
      goals,
    };
  }

  // Get debt summary
  async getDebtSummary(workspace) {
    const debts = await Debt.find({
      workspace,
      isArchived: false,
      isDeleted: false,
    }).lean();

    return {
      totalDebts: debts.length,
      debts,
    };
  }

  // Get investment summary
  async getInvestmentSummary(workspace) {
    const investments = await Investment.find({
      workspace,
      isArchived: false,
      isDeleted: false,
    }).lean();

    const totalCurrentValue = investments.reduce(
      (sum, investment) =>
        sum + investment.totalUnits * investment.currentPrice,
      0
    );

    return {
      totalInvestments: investments.length,
      totalCurrentValue,
      investments,
    };
  }

  // Get recent transactions
  async getRecentTransactions(workspace, limit = 10) {
    return Transaction.find({
      workspace,
      isDeleted: false,
    })
      .sort({
        transactionDate: -1,
      })
      .limit(limit)
      .populate("account", "name")
      .populate("category", "name color icon")
      .lean();
  }

  // Clear dashboard cache
  async clearDashboardCache(workspace) {
    return cacheService.del(
      REDIS_KEYS.DASHBOARD(workspace)
    );
  }
}

export default new DashboardService();