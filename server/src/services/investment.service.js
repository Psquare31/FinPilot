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

    if (assetType) {
      filter.assetType = assetType;
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
  async buyInvestment(id, payload) {
    const investment = await Investment.findById(id);

    if (!investment) {
      throw new ApiError(404, "Investment not found.");
    }

    const totalCost =
      investment.totalUnits * investment.averagePrice +
      payload.units * payload.price;

    investment.totalUnits += payload.units;

    investment.averagePrice =
      totalCost / investment.totalUnits;

    await investment.save();

    await InvestmentTransaction.create({
      investment: investment._id,
      workspace: investment.workspace,
      type: "buy",
      units: payload.units,
      price: payload.price,
      amount: payload.units * payload.price,
      transactionDate:
        payload.transactionDate ?? new Date(),
      notes: payload.notes,
    });

    return investment;
  }

  // Sell Investment
  async sellInvestment(id, payload) {
    const investment = await Investment.findById(id);

    if (!investment) {
      throw new ApiError(404, "Investment not found.");
    }

    if (investment.totalUnits < payload.units) {
      throw new ApiError(
        400,
        "Insufficient units available."
      );
    }

    investment.totalUnits -= payload.units;

    await investment.save();

    await InvestmentTransaction.create({
      investment: investment._id,
      workspace: investment.workspace,
      type: "sell",
      units: payload.units,
      price: payload.price,
      amount: payload.units * payload.price,
      transactionDate:
        payload.transactionDate ?? new Date(),
      notes: payload.notes,
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
        sum +
        investment.totalUnits *
          investment.averagePrice,
      0
    );

    const currentValue = investments.reduce(
      (sum, investment) =>
        sum +
        investment.totalUnits *
          investment.currentPrice,
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
        sum +
        investment.totalUnits *
          investment.currentPrice,
      0
    );

    return investments.map((investment) => {
      const value =
        investment.totalUnits *
        investment.currentPrice;

      return {
        investment: investment.name,
        assetType: investment.assetType,
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