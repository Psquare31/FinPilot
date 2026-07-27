import BaseService from "../../shared/services/base.service.js";
import ApiError from "../../utils/ApiError.js";

import Debt from "../../models/Debt.js";

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
      filter.type = debtType;
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

    // The schema tracks what is still owed (`outstandingAmount`), not what has
    // been paid: `paidAmount` and `totalAmount` do not exist. Reading them gave
    // undefined, so `paidAmount += amount` was NaN and the completion check
    // `NaN >= undefined` was always false — a debt could never be closed. The
    // assignment `status = "paid"` is not a member of DEBT_STATUS either
    // ("active" | "closed" | "defaulted"), and `paidAt` is not a field.
    //
    // A payment reduces the outstanding balance; how much has been paid is
    // derived from it by the `amountPaid` virtual.
    const outstanding = debt.outstandingAmount.amount;

    if (amount > outstanding) {
      throw new ApiError(
        400,
        "Payment exceeds the outstanding balance."
      );
    }

    debt.outstandingAmount.amount = outstanding - amount;

    if (debt.outstandingAmount.amount === 0) {
      debt.status = "closed";
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

    const totalAmount = debt.principalAmount.amount;

    const remainingAmount = debt.outstandingAmount.amount;

    const paidAmount = totalAmount - remainingAmount;

    const percentage =
      totalAmount > 0
        ? Number(((paidAmount / totalAmount) * 100).toFixed(2))
        : 0;

    return {
      totalAmount,
      paidAmount,
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

    // "paid" is not a DEBT_STATUS value, so this counted zero however many
    // debts had been cleared. The closed state is "closed".
    const paidDebts = debts.filter(
      (debt) => debt.status === "closed"
    ).length;

    const totalAmount = debts.reduce(
      (sum, debt) => sum + debt.principalAmount.amount,
      0
    );

    // .lean() strips virtuals, so amountPaid is not available here; derive it
    // from the same two fields the virtual uses.
    const totalPaid = debts.reduce(
      (sum, debt) =>
        sum + (debt.principalAmount.amount - debt.outstandingAmount.amount),
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