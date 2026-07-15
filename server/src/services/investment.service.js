import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Investment from "../models/Investment.js";
import InvestmentTransaction from "../models/InvestmentTransaction.js";

class InvestmentService extends BaseService {
  constructor() {
    super(Investment);
  }

  // Create Investment
  async createInvestment(payload) {
    const existingInvestment = await this.findOne({
      workspace: payload.workspace,
      symbol: payload.symbol,
      account: payload.account,
      isDeleted: false,
    });

    if (existingInvestment) {
      throw new ApiError(
        409,
        "Investment already exists."
      );
    }

    return this.create(payload);
  }

  // Get Investments
  async getInvestments(workspace, query = {}) {
    const {
      page = 1,
      limit = 10,
      assetType,
      broker,
      isArchived = false,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
      isArchived,
    };

    // The schema calls this `type`; `assetType` is kept as the query-string
    // name for API compatibility.
    if (assetType) {
      filter.type = assetType;
    }

    if (broker) {
      filter.broker = broker;
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
    });
  }

  // Get Investment by ID
  async getInvestmentById(id) {
    return this.findById(id);
  }

  // Update Investment
  async updateInvestment(id, payload) {
    return this.updateById(id, payload);
  }

  // Delete Investment
  async deleteInvestment(id) {
    return this.deleteById(id);
  }

  // Archive Investment
  async archiveInvestment(id) {
    return this.updateById(id, {
      isArchived: true,
    });
  }

  // Restore Investment
  async restoreInvestment(id) {
    return this.updateById(id, {
      isArchived: false,
    });
  }

  // Buy Investment
  //
  // The schema holds units in `quantity` and the running cost basis in
  // `purchasePrice` (a Money subdocument). `payload.quantity`/`payload.price`
  // are plain numbers from the request body.
  async buyInvestment(id, payload, userId) {
    const investment = await Investment.findById(id);

    if (!investment) {
      throw new ApiError(404, "Investment not found.");
    }

    const quantity = Number(payload.quantity);

    const price = Number(payload.price);

    if (!(quantity > 0)) {
      throw new ApiError(400, "Quantity must be greater than zero.");
    }

    // Weighted-average cost basis: existing holding valued at its current
    // average, plus the new lot at its actual price.
    const existingCost = investment.quantity * investment.purchasePrice.amount;

    const newCost = quantity * price;

    const newQuantity = investment.quantity + quantity;

    investment.quantity = newQuantity;

    investment.purchasePrice.amount =
      (existingCost + newCost) / newQuantity;

    await investment.save();

    await InvestmentTransaction.create({
      investment: investment._id,
      workspace: investment.workspace,
      account: investment.account,
      type: "buy",
      quantity,
      price: {
        amount: price,
        currency: investment.purchasePrice.currency,
      },
      transactionDate: payload.transactionDate ?? new Date(),
      notes: payload.notes,
      audit: { createdBy: userId },
    });

    return investment;
  }

  // Sell Investment
  async sellInvestment(id, payload, userId) {
    const investment = await Investment.findById(id);

    if (!investment) {
      throw new ApiError(404, "Investment not found.");
    }

    const quantity = Number(payload.quantity);

    const price = Number(payload.price);

    if (!(quantity > 0)) {
      throw new ApiError(400, "Quantity must be greater than zero.");
    }

    // This guard previously compared `investment.totalUnits` — a field the
    // schema does not define — so it evaluated `undefined < quantity`, which
    // is always false. Overselling was never blocked.
    if (investment.quantity < quantity) {
      throw new ApiError(
        400,
        "Insufficient units available."
      );
    }

    // Selling realises gains; it does not change the average cost basis of
    // the units still held.
    investment.quantity -= quantity;

    await investment.save();

    await InvestmentTransaction.create({
      investment: investment._id,
      workspace: investment.workspace,
      account: investment.account,
      type: "sell",
      quantity,
      price: {
        amount: price,
        currency: investment.purchasePrice.currency,
      },
      transactionDate: payload.transactionDate ?? new Date(),
      notes: payload.notes,
      audit: { createdBy: userId },
    });

    return investment;
  }

  // Update Current Price
  async updateCurrentPrice(id, currentPrice) {
    return this.updateById(id, {
      currentPrice,
      lastPriceUpdatedAt: new Date(),
    });
  }

  // Get Investment Summary
  async getInvestmentSummary(workspace) {
    const investments = await Investment.find({
      workspace,
      isDeleted: false,
      isArchived: false,
    }).lean();

    const totalInvested = investments.reduce(
      (sum, investment) =>
        sum + investment.quantity * investment.purchasePrice.amount,
      0
    );

    const currentValue = investments.reduce(
      (sum, investment) =>
        sum + investment.quantity * investment.currentPrice.amount,
      0
    );

    return {
      totalInvestments: investments.length,
      totalInvested,
      currentValue,
      profitLoss:
        currentValue - totalInvested,
      returnPercentage:
        totalInvested > 0
          ? Number(
              (
                ((currentValue - totalInvested) /
                  totalInvested) *
                100
              ).toFixed(2)
            )
          : 0,
    };
  }

  // Get Portfolio Allocation
  async getPortfolioAllocation(workspace) {
    const investments = await Investment.find({
      workspace,
      isDeleted: false,
      isArchived: false,
    }).lean();

    const totalValue = investments.reduce(
      (sum, investment) =>
        sum + investment.quantity * investment.currentPrice.amount,
      0
    );

    return investments.map((investment) => {
      const value =
        investment.quantity * investment.currentPrice.amount;

      return {
        investment: investment.name,
        assetType: investment.type,
        value,
        allocation:
          totalValue > 0
            ? Number(
                (
                  (value / totalValue) *
                  100
                ).toFixed(2)
              )
            : 0,
      };
    });
  }
}

export default new InvestmentService();