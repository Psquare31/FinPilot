import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import InvestmentTransaction from "../models/InvestmentTransaction.js";

class InvestmentTransactionService extends BaseService {
  constructor() {
    super(InvestmentTransaction);
  }

  // Get Investment Transactions
  async getInvestmentTransactions(workspace, query = {}) {
    const {
      investment,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
    };

    if (investment) {
      filter.investment = investment;
    }

    if (type) {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.transactionDate = {};

      if (startDate) {
        filter.transactionDate.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.transactionDate.$lte = new Date(endDate);
      }
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-transactionDate",
      populate: [
        {
          path: "investment",
          select: "name symbol assetType",
        },
      ],
    });
  }

  // Get Investment Transaction by ID
  async getInvestmentTransactionById(id) {
    return this.findById(id, {
      populate: [
        {
          path: "investment",
          select:
            "name symbol assetType currentPrice",
        },
      ],
    });
  }

  // Delete Investment Transaction
  async deleteInvestmentTransaction(id) {
    return this.deleteById(id);
  }

  // Get Investment History
  async getInvestmentHistory(investmentId) {
    return InvestmentTransaction.find({
      investment: investmentId,
      isDeleted: false,
    })
      .sort({
        transactionDate: -1,
      })
      .lean();
  }

  // Get Recent Investment Transactions
  async getRecentTransactions(
    workspace,
    limit = 10
  ) {
    return InvestmentTransaction.find({
      workspace,
      isDeleted: false,
    })
      .sort({
        transactionDate: -1,
      })
      .limit(limit)
      .populate(
        "investment",
        "name symbol assetType"
      )
      .lean();
  }

  // Get Investment Activity Summary
  async getActivitySummary(workspace) {
    const summary =
      await InvestmentTransaction.aggregate([
        {
          $match: {
            workspace,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$type",
            totalAmount: {
              $sum: "$amount",
            },
            totalTransactions: {
              $sum: 1,
            },
          },
        },
      ]);

    return summary;
  }
}

export default new InvestmentTransactionService();