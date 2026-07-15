import BaseService from "./base.service.js";
import toObjectId from "../utils/toObjectId.js";

import Report from "../models/Report.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import Debt from "../models/Debt.js";
import Investment from "../models/Investment.js";

class ReportService extends BaseService {
  constructor() {
    super(Report);
  }

  // Create Report
  async createReport(payload) {
    return this.create(payload);
  }

  // Get Reports
  async getReports(workspace, query = {}) {
    const {
      page = 1,
      limit = 10,
      type,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
    };

    if (type) {
      filter.type = type;
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
    });
  }

  // Get Report by ID
  async getReportById(id) {
    return this.findById(id);
  }

  // Delete Report
  async deleteReport(id) {
    return this.deleteById(id);
  }

  // Generate Monthly Report
  async generateMonthlyReport(workspace, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const [accounts, transactions, budgets, goals, debts, investments] =
      await Promise.all([
        Account.find({
          workspace,
          isDeleted: false,
        }).lean(),

        Transaction.find({
          workspace,
          transactionDate: {
            $gte: startDate,
            $lt: endDate,
          },
          isDeleted: false,
        }).lean(),

        Budget.find({
          workspace,
          isDeleted: false,
        }).lean(),

        Goal.find({
          workspace,
          isDeleted: false,
        }).lean(),

        Debt.find({
          workspace,
          isDeleted: false,
        }).lean(),

        Investment.find({
          workspace,
          isDeleted: false,
        }).lean(),
      ]);

    return {
      period: {
        year,
        month,
      },
      accounts,
      transactions,
      budgets,
      goals,
      debts,
      investments,
    };
  }

  // Generate Net Worth Report
  async generateNetWorthReport(workspace) {
    const accounts = await Account.find({
      workspace,
      isDeleted: false,
    }).lean();

    const investments = await Investment.find({
      workspace,
      isDeleted: false,
    }).lean();

    const debts = await Debt.find({
      workspace,
      isDeleted: false,
    }).lean();

    const cashBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    const investmentValue = investments.reduce(
      (sum, investment) =>
        sum +
        investment.totalUnits *
          investment.currentPrice,
      0
    );

    const totalDebt = debts.reduce(
      (sum, debt) =>
        sum +
        (debt.totalAmount - debt.paidAmount),
      0
    );

    return {
      assets: cashBalance + investmentValue,
      liabilities: totalDebt,
      netWorth:
        cashBalance +
        investmentValue -
        totalDebt,
    };
  }

  // Generate Cash Flow Report
  async generateCashFlowReport(workspace) {
    const summary = await Transaction.aggregate([
      {
        $match: {
          workspace: toObjectId(workspace, "workspace"),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$type",
          total: {
            $sum: "$money.amount",
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

  // Generate Investment Report
  async generateInvestmentReport(workspace) {
    const investments = await Investment.find({
      workspace,
      isDeleted: false,
    }).lean();

    return investments.map((investment) => ({
      name: investment.name,
      symbol: investment.symbol,
      invested:
        investment.totalUnits *
        investment.averagePrice,
      currentValue:
        investment.totalUnits *
        investment.currentPrice,
      profitLoss:
        investment.totalUnits *
        (investment.currentPrice -
          investment.averagePrice),
    }));
  }
}

export default new ReportService();