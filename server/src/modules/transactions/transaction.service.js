import BaseService from "../../shared/services/base.service.js";
import ApiError from "../../utils/ApiError.js";
import withTransaction from "../../utils/withTransaction.js";
import toObjectId from "../../utils/toObjectId.js";
import permissionService from "../../shared/services/permission.service.js";

import Transaction from "../../models/Transaction.js";
import Account from "../../models/Account.js";
import Category from "../../models/Category.js";

// The amount of record lives in the `money` subdocument. Older callers sent a
// flat `amount` alongside it, so accept either but always treat `money.amount`
// as authoritative — reading the wrong one silently produced NaN balances.
const amountOf = (source) => {
  const value = source?.money?.amount ?? source?.amount;

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, "Amount must be a number greater than zero.");
  }

  return amount;
};

// Money is stored to 2 decimals; accumulating raw floats drifts the balance.
const round = (value) => Number(value.toFixed(2));

class TransactionService extends BaseService {
  constructor() {
    super(Transaction);
  }

  // Apply a signed delta to an account, guarding the schema's `min: 0` balance
  // so an overdraft surfaces as a 400 rather than a Mongoose cast error.
  applyDelta(account, delta) {
    const next = round(account.balance + delta);

    if (next < 0) {
      throw new ApiError(400, "Insufficient account balance.");
    }

    account.balance = next;
  }

  // Signed effect a transaction has on its own account.
  deltaFor(type, amount) {
    switch (type) {
      case "income":
        return amount;

      case "expense":
      case "transfer":
        return -amount;

      default:
        throw new ApiError(400, "Invalid transaction type.");
    }
  }

  // Load an account inside the session, scoped to the workspace.
  async loadAccount(accountId, workspace, session, label = "Account") {
    const account = await Account.findOne({
      _id: accountId,
      ...(workspace ? { workspace } : {}),
      isArchived: false,
    }).session(session ?? null);

    if (!account) {
      throw new ApiError(404, `${label} not found.`);
    }

    return account;
  }

  // Create Transaction
  //
  // `workspace` and `audit.createdBy` are derived server-side from the account
  // and the authenticated user — they used to be trusted from the request body,
  // which let any caller write into a workspace they don't belong to.
  async createTransaction(userId, payload) {
    const amount = amountOf(payload);

    return withTransaction(async (session) => {
      const account = await this.loadAccount(
        payload.account,
        undefined,
        session
      );

      const workspace = account.workspace;

      await permissionService.requireWorkspaceAccess(workspace, userId);

      const category = await Category.findOne({
        _id: payload.category,
        workspace,
        isArchived: false,
      }).session(session);

      if (!category) {
        throw new ApiError(404, "Category not found.");
      }

      const accountsToSave = [account];

      if (payload.type === "transfer") {
        const destination = await this.loadAccount(
          payload.transferAccount,
          workspace,
          session,
          "Destination account"
        );

        if (String(destination._id) === String(account._id)) {
          throw new ApiError(
            400,
            "Transfer account cannot be the same as the source account."
          );
        }

        this.applyDelta(destination, amount);
        accountsToSave.push(destination);
      }

      this.applyDelta(account, this.deltaFor(payload.type, amount));

      const transaction = await this.create(
        {
          ...payload,
          workspace,
          money: {
            amount,
            currency: payload.money?.currency || account.currency,
          },
          audit: { createdBy: userId },
        },
        { session }
      );

      await Promise.all(
        accountsToSave.map((item) => item.save({ session }))
      );

      return transaction;
    });
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
  //
  // Reverses the original effect on the original account, then applies the new
  // effect on the (possibly different) target account.
  async updateTransaction(id, userId, payload) {
    return withTransaction(async (session) => {
      const transaction = await Transaction.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);

      if (!transaction) {
        throw new ApiError(404, "Transaction not found.");
      }

      await permissionService.requireWorkspaceAccess(
        transaction.workspace,
        userId
      );

      const oldAmount = amountOf(transaction);

      const oldAccount = await this.loadAccount(
        transaction.account,
        transaction.workspace,
        session
      );

      const newAccountId = payload.account ?? transaction.account;

      const sameAccount =
        String(newAccountId) === String(oldAccount._id);

      const newAccount = sameAccount
        ? oldAccount
        : await this.loadAccount(
            newAccountId,
            transaction.workspace,
            session,
            "Destination account"
          );

      const newType = payload.type ?? transaction.type;

      const newAmount =
        payload.money?.amount !== undefined || payload.amount !== undefined
          ? amountOf(payload)
          : oldAmount;

      // Reverse the original effect, then apply the new one. Both land on the
      // same document when the account is unchanged, so the net delta is right.
      this.applyDelta(
        oldAccount,
        -this.deltaFor(transaction.type, oldAmount)
      );

      this.applyDelta(newAccount, this.deltaFor(newType, newAmount));

      const accountsToSave = sameAccount
        ? [oldAccount]
        : [oldAccount, newAccount];

      await Promise.all(
        accountsToSave.map((item) => item.save({ session }))
      );

      Object.assign(transaction, payload, {
        money: {
          amount: newAmount,
          currency:
            payload.money?.currency ?? transaction.money.currency,
        },
        audit: {
          ...transaction.audit.toObject(),
          updatedBy: userId,
        },
      });

      await transaction.save({ session });

      return transaction;
    });
  }

  // Delete Transaction
  //
  // Soft delete: the model carries `isDeleted`/`deletedAt` and every read path
  // filters on them, so hard-deleting here lost the audit trail.
  async deleteTransaction(id, userId) {
    return withTransaction(async (session) => {
      const transaction = await Transaction.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);

      if (!transaction) {
        throw new ApiError(404, "Transaction not found.");
      }

      await permissionService.requireWorkspaceAccess(
        transaction.workspace,
        userId
      );

      const amount = amountOf(transaction);

      const account = await this.loadAccount(
        transaction.account,
        transaction.workspace,
        session
      );

      const accountsToSave = [account];

      // A transfer moved money out of `account` and into `transferAccount`;
      // undoing it has to reverse both sides.
      if (transaction.type === "transfer" && transaction.transferAccount) {
        const destination = await this.loadAccount(
          transaction.transferAccount,
          transaction.workspace,
          session,
          "Destination account"
        );

        this.applyDelta(destination, -amount);
        accountsToSave.push(destination);
      }

      this.applyDelta(
        account,
        -this.deltaFor(transaction.type, amount)
      );

      await Promise.all(
        accountsToSave.map((item) => item.save({ session }))
      );

      transaction.isDeleted = true;
      transaction.deletedAt = new Date();

      await transaction.save({ session });

      return true;
    });
  }
  
  // Transfer Between Accounts
  //
  // A transfer is a single `type: "transfer"` record carrying `transferAccount`
  // — the model validates that pairing and `createTransaction` moves both
  // balances. The previous version wrote two loose income/expense rows tagged
  // with an `isTransfer` flag that is a read-only virtual, so it never stuck.
  async transferBetweenAccounts(userId, payload) {
    const { fromAccount, toAccount, ...rest } = payload;

    return this.createTransaction(userId, {
      ...rest,
      account: fromAccount,
      transferAccount: toAccount,
      type: "transfer",
    });
  }

  // Bulk Create Transactions
  async bulkCreateTransactions(userId, payload = []) {
    if (!payload.length) {
      throw new ApiError(400, "Transactions are required.");
    }

    // Reuse the single-create path so every row gets the same permission check,
    // balance math and audit stamping.
    const created = [];

    for (const item of payload) {
      created.push(await this.createTransaction(userId, item));
    }

    return created;
  }

  // Bulk Delete Transactions
  async bulkDeleteTransactions(userId, transactionIds = []) {
    if (!transactionIds.length) {
      throw new ApiError(400, "Transaction IDs are required.");
    }

    let deletedCount = 0;

    for (const id of transactionIds) {
      await this.deleteTransaction(id, userId);
      deletedCount += 1;
    }

    return { deletedCount };
  }

  // Duplicate Transaction
  async duplicateTransaction(id, userId) {
    const transaction = await Transaction.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!transaction) {
      throw new ApiError(404, "Transaction not found.");
    }

    const duplicate = transaction.toObject();

    delete duplicate._id;
    delete duplicate.id;
    delete duplicate.createdAt;
    delete duplicate.updatedAt;
    delete duplicate.audit;
    delete duplicate.isDeleted;
    delete duplicate.deletedAt;

    duplicate.transactionDate = new Date();

    return this.createTransaction(userId, duplicate);
  }

    // Get Monthly Summary
  async getMonthlySummary(workspace, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const summary = await Transaction.aggregate([
      {
        $match: {
          workspace: toObjectId(workspace, "workspace"),
          isDeleted: false,
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
      savings: income - expense,
    };
  }

  // Get Cash Flow
  async getCashFlow(workspace, startDate, endDate) {
    return Transaction.aggregate([
      {
        $match: {
          workspace: toObjectId(workspace, "workspace"),
          isDeleted: false,
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
                "$money.amount",
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
                "$money.amount",
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
          workspace: toObjectId(workspace, "workspace"),
          isDeleted: false,
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
            $sum: "$money.amount",
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
          workspace: toObjectId(workspace, "workspace"),
          isDeleted: false,
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: {
            $sum: "$money.amount",
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
          workspace: toObjectId(workspace, "workspace"),
          isDeleted: false,
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$account",
          total: {
            $sum: "$money.amount",
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

  // Get Transaction Statistics
  async getTransactionStatistics(workspace) {
    const [totalTransactions, income, expense] =
      await Promise.all([
        Transaction.countDocuments({
          workspace,
          isDeleted: false,
        }),
        Transaction.aggregate([
          {
            $match: {
              workspace: toObjectId(workspace, "workspace"),
              isDeleted: false,
              type: "income",
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$money.amount",
              },
            },
          },
        ]),
        Transaction.aggregate([
          {
            $match: {
              workspace: toObjectId(workspace, "workspace"),
              isDeleted: false,
              type: "expense",
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$money.amount",
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