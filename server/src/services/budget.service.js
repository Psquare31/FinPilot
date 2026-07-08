import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

class BudgetService extends BaseService {
  constructor() {
    super(Budget);
  }

  // Create Budget
  async createBudget(payload) {
    const existingBudget = await this.findOne({
      workspace: payload.workspace,
      category: payload.category,
      period: payload.period,
      startDate: payload.startDate,
      isDeleted: false,
    });

    if (existingBudget) {
      throw new ApiError(
        409,
        "Budget already exists for this category and period."
      );
    }

    return this.create(payload);
  }

  // Get Budgets
  async getBudgets(workspace, query = {}) {
    const {
      page = 1,
      limit = 10,
      status,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
      populate: [
        {
          path: "category",
          select: "name color icon",
        },
      ],
    });
  }

  // Get Budget by ID
  async getBudgetById(id) {
    return this.findById(id, {
      populate: [
        {
          path: "category",
          select: "name color icon",
        },
      ],
    });
  }

  // Update Budget
  async updateBudget(id, payload) {
    return this.updateById(id, payload);
  }

  // Delete Budget
  async deleteBudget(id) {
    return this.deleteById(id);
  }

  // Archive Budget
  async archiveBudget(id) {
    return this.updateById(id, {
      isArchived: true,
    });
  }

  // Restore Budget
  async restoreBudget(id) {
    return this.updateById(id, {
      isArchived: false,
    });
  }

  // Get Budget Progress
  async getBudgetProgress(id) {
    const budget = await Budget.findById(id);

    if (!budget) {
      throw new ApiError(404, "Budget not found.");
    }

    const spent = await Transaction.aggregate([
      {
        $match: {
          workspace: budget.workspace,
          category: budget.category,
          type: "expense",
          transactionDate: {
            $gte: budget.startDate,
            $lte: budget.endDate,
          },
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
    ]);

    const totalSpent = spent[0]?.total ?? 0;

    const remaining = budget.amount - totalSpent;

    const percentage =
      budget.amount > 0
        ? Number(((totalSpent / budget.amount) * 100).toFixed(2))
        : 0;

    return {
      budgetAmount: budget.amount,
      spent: totalSpent,
      remaining,
      percentage,
      exceeded: totalSpent > budget.amount,
    };
  }

  // Get Budget Overview
  async getBudgetOverview(workspace) {
    const budgets = await Budget.find({
      workspace,
      isArchived: false,
      isDeleted: false,
    }).lean();

    const overview = await Promise.all(
      budgets.map(async (budget) => ({
        budget,
        progress: await this.getBudgetProgress(budget._id),
      }))
    );

    return overview;
  }
}

export default new BudgetService();