import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Goal from "../models/Goal.js";

class GoalService extends BaseService {
  constructor() {
    super(Goal);
  }

  // Create Goal
  async createGoal(payload) {
    const existingGoal = await this.findOne({
      workspace: payload.workspace,
      name: payload.name,
      isDeleted: false,
    });

    if (existingGoal) {
      throw new ApiError(
        409,
        "Goal with this name already exists."
      );
    }

    return this.create(payload);
  }

  // Get Goals
  async getGoals(workspace, query = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      isArchived = false,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
      isArchived,
    };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
    });
  }

  // Get Goal by ID
  async getGoalById(id) {
    return this.findById(id);
  }

  // Update Goal
  async updateGoal(id, payload) {
    return this.updateById(id, payload);
  }

  // Delete Goal
  async deleteGoal(id) {
    return this.deleteById(id);
  }

  // Archive Goal
  async archiveGoal(id) {
    return this.updateById(id, {
      isArchived: true,
    });
  }

  // Restore Goal
  async restoreGoal(id) {
    return this.updateById(id, {
      isArchived: false,
    });
  }

  // Add Contribution
  async addContribution(id, amount) {
    const goal = await Goal.findById(id);

    if (!goal) {
      throw new ApiError(404, "Goal not found.");
    }

    goal.currentAmount += amount;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = "completed";
      goal.completedAt = new Date();
    }

    await goal.save();

    return goal;
  }

  // Withdraw Contribution
  async withdrawContribution(id, amount) {
    const goal = await Goal.findById(id);

    if (!goal) {
      throw new ApiError(404, "Goal not found.");
    }

    if (goal.currentAmount < amount) {
      throw new ApiError(
        400,
        "Withdrawal amount exceeds current savings."
      );
    }

    goal.currentAmount -= amount;

    if (goal.status === "completed") {
      goal.status = "active";
      goal.completedAt = null;
    }

    await goal.save();

    return goal;
  }

  // Get Goal Progress
  async getGoalProgress(id) {
    const goal = await Goal.findById(id);

    if (!goal) {
      throw new ApiError(404, "Goal not found.");
    }

    const percentage =
      goal.targetAmount > 0
        ? Number(
            (
              (goal.currentAmount / goal.targetAmount) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount:
        goal.targetAmount - goal.currentAmount,
      percentage,
      completed:
        goal.currentAmount >= goal.targetAmount,
    };
  }

  // Get Goal Summary
  async getGoalSummary(workspace) {
    const goals = await Goal.find({
      workspace,
      isDeleted: false,
    }).lean();

    const totalGoals = goals.length;

    const completedGoals = goals.filter(
      (goal) => goal.status === "completed"
    ).length;

    const totalTarget = goals.reduce(
      (sum, goal) => sum + goal.targetAmount,
      0
    );

    const totalSaved = goals.reduce(
      (sum, goal) => sum + goal.currentAmount,
      0
    );

    return {
      totalGoals,
      completedGoals,
      activeGoals: totalGoals - completedGoals,
      totalTarget,
      totalSaved,
      completionRate:
        totalGoals > 0
          ? Number(
              (
                (completedGoals / totalGoals) *
                100
              ).toFixed(2)
            )
          : 0,
    };
  }
}

export default new GoalService();