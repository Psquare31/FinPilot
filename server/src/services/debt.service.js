import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Debt from "../models/Debt.js";

class DebtService extends BaseService {
  constructor() {
    super(Debt);
  }

  // Create Debt
  async createDebt(payload) {
    const existingDebt = await this.findOne({
      workspace: payload.workspace,
      lender: payload.lender,
      name: payload.name,
      isDeleted: false,
    });

    if (existingDebt) {
      throw new ApiError(
        409,
        "Debt with this name already exists."
      );
    }

    return this.create(payload);
  }

  // Get Debts
  async getDebts(workspace, query = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      debtType,
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

    if (debtType) {
      filter.debtType = debtType;
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
    });
  }

  // Get Debt by ID
  async getDebtById(id) {
    return this.findById(id);
  }

  // Update Debt
  async updateDebt(id, payload) {
    return this.updateById(id, payload);
  }

  // Delete Debt
  async deleteDebt(id) {
    return this.deleteById(id);
  }

  // Archive Debt
  async archiveDebt(id) {
    return this.updateById(id, {
      isArchived: true,
    });
  }

  // Restore Debt
  async restoreDebt(id) {
    return this.updateById(id, {
      isArchived: false,
    });
  }

  // Record Payment
  async recordPayment(id, amount) {
    const debt = await Debt.findById(id);

    if (!debt) {
      throw new ApiError(404, "Debt not found.");
    }

    if (amount <= 0) {
      throw new ApiError(
        400,
        "Payment amount must be greater than zero."
      );
    }

    debt.paidAmount += amount;

    if (debt.paidAmount >= debt.totalAmount) {
      debt.status = "paid";
      debt.paidAt = new Date();
    }

    await debt.save();

    return debt;
  }

  // Get Debt Progress
  async getDebtProgress(id) {
    const debt = await Debt.findById(id);

    if (!debt) {
      throw new ApiError(404, "Debt not found.");
    }

    const remainingAmount =
      debt.totalAmount - debt.paidAmount;

    const percentage =
      debt.totalAmount > 0
        ? Number(
            (
              (debt.paidAmount / debt.totalAmount) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      totalAmount: debt.totalAmount,
      paidAmount: debt.paidAmount,
      remainingAmount,
      percentage,
      completed: remainingAmount <= 0,
    };
  }

  // Get Debt Summary
  async getDebtSummary(workspace) {
    const debts = await Debt.find({
      workspace,
      isDeleted: false,
      isArchived: false,
    }).lean();

    const totalDebts = debts.length;

    const paidDebts = debts.filter(
      (debt) => debt.status === "paid"
    ).length;

    const totalAmount = debts.reduce(
      (sum, debt) => sum + debt.totalAmount,
      0
    );

    const totalPaid = debts.reduce(
      (sum, debt) => sum + debt.paidAmount,
      0
    );

    return {
      totalDebts,
      activeDebts: totalDebts - paidDebts,
      paidDebts,
      totalAmount,
      totalPaid,
      remainingAmount: totalAmount - totalPaid,
      completionRate:
        totalDebts > 0
          ? Number(
              (
                (paidDebts / totalDebts) *
                100
              ).toFixed(2)
            )
          : 0,
    };
  }

  // Get Upcoming Payments
  async getUpcomingPayments(workspace, days = 30) {
    const today = new Date();

    const endDate = new Date();
    endDate.setDate(today.getDate() + Number(days));

    return Debt.find({
      workspace,
      status: {
        $ne: "paid",
      },
      dueDate: {
        $gte: today,
        $lte: endDate,
      },
      isDeleted: false,
      isArchived: false,
    })
      .sort({
        dueDate: 1,
      })
      .lean();
  }
}

export default new DebtService();