import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import Category from "../models/Category.js";

class TransactionService extends BaseService {
  constructor() {
    super(Transaction);
  }

  // Create Transaction
  async createTransaction(payload) {

    const account = await Account.findOne({
        _id: payload.account,
        workspace: payload.workspace,
        isArchived: false,
        isDeleted: false,
    });


    if (!account) {
      throw new ApiError(404, "Account not found.");
    }

    const category = await Category.findOne({
        _id: payload.category,
        workspace: payload.workspace,
        isArchived: false,
        isDeleted: false,
    });

    if (!category) {
      throw new ApiError(404, "Category not found.");
    }

    const transaction = await this.create(payload);

    if (payload.type === "income") {
      account.balance += payload.amount;
    } else if (payload.type === "expense") {
        if (account.balance < payload.amount) {
            throw new ApiError( 400, "Insufficient balance.");
        } else {
            account.balance -= payload.amount;
        }
    }

    await account.save();

    return transaction;
  }

  // Get Transactions
  async getTransactions(workspace, query = {}) {
    const {
      account,
      category,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
    };

    if (account) filter.account = account;

    if (category) filter.category = category;

    if (type) filter.type = type;

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
          path: "account",
          select: "name type color",
        },
        {
          path: "category",
          select: "name icon color",
        },
      ],
    });
  }

  // Get Transaction by ID
  async getTransactionById(id) {
    return this.findById(id, {
      populate: [
        {
          path: "account",
          select: "name type color balance",
        },
        {
          path: "category",
          select: "name icon color",
        },
      ],
    });
  }

  // Update Transaction
  async updateTransaction(id, payload) {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw new ApiError(404, "Transaction not found.");
    }

    const account = await Account.findById(transaction.account);

    if (!account) {
      throw new ApiError(404, "Account not found.");
    }

    // Reverse previous balance
    if (transaction.type === "income") {
      account.balance -= transaction.amount;
    } else if (transaction.type === "expense") {
      account.balance += transaction.amount;
    }

    const updatedType = payload.type ?? transaction.type;
    const updatedAmount = payload.amount ?? transaction.amount;

    // Apply new balance
    if (updatedType === "income") {
      account.balance += updatedAmount;
    } else if (updatedType === "expense") {
      account.balance -= updatedAmount;
    }

    await account.save();

    return this.updateById(id, payload);
  }

  // Delete Transaction
  async deleteTransaction(id) {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw new ApiError(404, "Transaction not found.");
    }

    const account = await Account.findById(transaction.account);

    if (!account) {
      throw new ApiError(404, "Account not found.");
    }

    if (transaction.type === "income") {
      account.balance -= transaction.amount;
    } else if (transaction.type === "expense") {
      account.balance += transaction.amount;
    }

    await account.save();

    return this.deleteById(id);
  }

    // Transfer Between Accounts
  async transferBetweenAccounts(payload) {
    const {
      fromAccount,
      toAccount,
      amount,
      workspace,
      category,
      transactionDate,
      description,
    } = payload;

    if (fromAccount === toAccount) {
      throw new ApiError(
        400,
        "Source and destination accounts cannot be the same."
      );
    }

    const source = await Account.findById(fromAccount);
    const destination = await Account.findById(toAccount);

    if (!source || !destination) {
      throw new ApiError(404, "Account not found.");
    }

    if (source.balance < amount) {
      throw new ApiError(
        400,
        "Insufficient account balance."
      );
    }

    source.balance -= amount;
    destination.balance += amount;

    await Promise.all([
      source.save(),
      destination.save(),
    ]);

    const [expenseTransaction, incomeTransaction] =
      await Transaction.create([
        {
          workspace,
          account: fromAccount,
          category,
          amount,
          type: "expense",
          description,
          transactionDate,
          isTransfer: true,
        },
        {
          workspace,
          account: toAccount,
          category,
          amount,
          type: "income",
          description,
          transactionDate,
          isTransfer: true,
        },
      ]);

    return {
      expenseTransaction,
      incomeTransaction,
    };
  }

  // Bulk Create Transactions
  async bulkCreateTransactions(payload = []) {
    if (!payload.length) {
      throw new ApiError(
        400,
        "Transactions are required."
      );
    }

    const transactions = await Transaction.insertMany(payload);

    for (const transaction of transactions) {
      const account = await Account.findById(
        transaction.account
      );

      if (!account) continue;

      if (transaction.type === "income") {
        account.balance += transaction.amount;
      } else if (transaction.type === "expense") {
        account.balance -= transaction.amount;
      }

      await account.save();
    }

    return transactions;
  }

  // Bulk Delete Transactions
  async bulkDeleteTransactions(transactionIds = []) {
    if (!transactionIds.length) {
      throw new ApiError(
        400,
        "Transaction IDs are required."
      );
    }

    const transactions = await Transaction.find({
      _id: {
        $in: transactionIds,
      },
    });

    for (const transaction of transactions) {
      const account = await Account.findById(
        transaction.account
      );

      if (!account) continue;

      if (transaction.type === "income") {
        account.balance -= transaction.amount;
      } else if (transaction.type === "expense") {
        account.balance += transaction.amount;
      }

      await account.save();
    }

    await Transaction.deleteMany({
      _id: {
        $in: transactionIds,
      },
    });

    return {
      deletedCount: transactions.length,
    };
  }

  // Duplicate Transaction
  async duplicateTransaction(id) {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw new ApiError(
        404,
        "Transaction not found."
      );
    }

    const duplicate = transaction.toObject();

    delete duplicate._id;
    delete duplicate.createdAt;
    delete duplicate.updatedAt;

    duplicate.transactionDate = new Date();

    return this.createTransaction(duplicate);
  }

    // Get Monthly Summary
  async getMonthlySummary(workspace, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const summary = await Transaction.aggregate([
      {
        $match: {
          workspace,
          transactionDate: {
            $gte: startDate,
            $lt: endDate,
          },
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
      savings: income - expense,
    };
  }

  // Get Cash Flow
  async getCashFlow(workspace, startDate, endDate) {
    return Transaction.aggregate([
      {
        $match: {
          workspace,
          transactionDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$transactionDate",
            },
          },
          income: {
            $sum: {
              $cond: [
                {
                  $eq: ["$type", "income"],
                },
                "$amount",
                0,
              ],
            },
          },
          expense: {
            $sum: {
              $cond: [
                {
                  $eq: ["$type", "expense"],
                },
                "$amount",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  }

  // Get Income vs Expense
  async getIncomeVsExpense(workspace) {
    const result = await Transaction.aggregate([
      {
        $match: {
          workspace,
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

    return {
      income:
        result.find((item) => item._id === "income")?.total ?? 0,
      expense:
        result.find((item) => item._id === "expense")?.total ?? 0,
    };
  }

  // Get Expense Breakdown
  async getExpenseBreakdown(workspace) {
    return Transaction.aggregate([
      {
        $match: {
          workspace,
          type: "expense",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $group: {
          _id: "$category.name",
          total: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
    ]);
  }

  // Get Spending by Category
  async getSpendingByCategory(workspace) {
    return Transaction.aggregate([
      {
        $match: {
          workspace,
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: {
            $sum: "$amount",
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          name: "$category.name",
          color: "$category.color",
          icon: "$category.icon",
          total: 1,
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
    ]);
  }

  // Get Spending by Account
  async getSpendingByAccount(workspace) {
    return Transaction.aggregate([
      {
        $match: {
          workspace,
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$account",
          total: {
            $sum: "$amount",
          },
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "_id",
          foreignField: "_id",
          as: "account",
        },
      },
      {
        $unwind: "$account",
      },
      {
        $project: {
          name: "$account.name",
          color: "$account.color",
          icon: "$account.icon",
          total: 1,
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
    ]);
  }

  // Get Recent Transactions
  async getRecentTransactions(workspace, limit = 10) {
    return Transaction.find({
      workspace,
    })
      .sort({
        transactionDate: -1,
      })
      .limit(limit)
      .populate("account", "name")
      .populate("category", "name color icon")
      .lean();
  }

  // Get Transaction Statistics
  async getTransactionStatistics(workspace) {
    const [totalTransactions, income, expense] =
      await Promise.all([
        Transaction.countDocuments({
          workspace,
        }),
        Transaction.aggregate([
          {
            $match: {
              workspace,
              type: "income",
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount",
              },
            },
          },
        ]),
        Transaction.aggregate([
          {
            $match: {
              workspace,
              type: "expense",
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount",
              },
            },
          },
        ]),
      ]);

    return {
      totalTransactions,
      totalIncome: income[0]?.total ?? 0,
      totalExpense: expense[0]?.total ?? 0,
      netCashFlow:
        (income[0]?.total ?? 0) -
        (expense[0]?.total ?? 0),
    };
  }
}

export default new TransactionService();