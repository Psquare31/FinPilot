import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import Debt from "../models/Debt.js";
import Investment from "../models/Investment.js";

class DashboardService {
  // Get Dashboard Overview
  async getDashboard(workspace) {
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

    return {
      accounts: accountSummary,
      transactions: transactionSummary,
      budgets: budgetSummary,
      goals: goalSummary,
      debts: debtSummary,
      investments: investmentSummary,
      recentTransactions,
    };
  }

  // Get Account Summary
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

  // Get Transaction Summary
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

  // Get Budget Summary
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

  // Get Goal Summary
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

  // Get Debt Summary
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

  // Get Investment Summary
  async getInvestmentSummary(workspace) {
    const investments = await Investment.find({
      workspace,
      isArchived: false,
      isDeleted: false,
    }).lean();

    const totalCurrentValue = investments.reduce(
      (sum, investment) =>
        sum +
        investment.totalUnits *
          investment.currentPrice,
      0
    );

    return {
      totalInvestments: investments.length,
      totalCurrentValue,
      investments,
    };
  }

  // Get Recent Transactions
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
}

export default new DashboardService();