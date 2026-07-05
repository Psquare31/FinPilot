import mongoose from "mongoose";

import {
  INVESTMENT_TYPES,
  RISK_LEVELS,
} from "../constants/index.js";

import moneySchema from "./schemas/Money.js";
import auditSchema from "./schemas/Audit.js";

const { Schema } = mongoose;

const investmentSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    symbol: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: INVESTMENT_TYPES,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    purchasePrice: {
      type: moneySchema,
      required: true,
    },

    currentPrice: {
      type: moneySchema,
      required: true,
    },

    purchaseDate: {
      type: Date,
      required: true,
    },

    riskLevel: {
      type: String,
      enum: RISK_LEVELS,
      default: "medium",
    },

    broker: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    audit: {
      type: auditSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// ===========================
// Indexes
// ===========================

investmentSchema.index({
  workspace: 1,
  type: 1,
});

investmentSchema.index({
  workspace: 1,
  symbol: 1,
});

investmentSchema.index({
  workspace: 1,
  purchaseDate: -1,
});

// ===========================
// Virtuals
// ===========================

investmentSchema.virtual("investedValue").get(function () {
  return this.purchasePrice.amount * this.quantity;
});

investmentSchema.virtual("currentValue").get(function () {
  return this.currentPrice.amount * this.quantity;
});

investmentSchema.virtual("profitLoss").get(function () {
  return this.currentValue - this.investedValue;
});

investmentSchema.virtual("returnPercentage").get(function () {
  if (this.investedValue === 0) return 0;

  return (
    (this.profitLoss / this.investedValue) * 100
  );
});

const Investment =
  mongoose.models.Investment ||
  mongoose.model("Investment", investmentSchema);

export default Investment;