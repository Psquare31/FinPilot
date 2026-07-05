import mongoose from "mongoose";

import {
  INVESTMENT_TRANSACTION_TYPES,
  INVESTMENT_TRANSACTION_STATUS,
} from "../constants/index.js";

import moneySchema from "./schemas/Money.js";
import auditSchema from "./schemas/Audit.js";

const { Schema } = mongoose;

const investmentTransactionSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    investment: {
      type: Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
      index: true,
    },

    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    type: {
      type: String,
      enum: INVESTMENT_TRANSACTION_TYPES,
      required: true,
    },

    status: {
      type: String,
      enum: INVESTMENT_TRANSACTION_STATUS,
      default: "completed",
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: moneySchema,
      required: true,
    },

    brokerage: {
      type: moneySchema,
      default: () => ({
        amount: 0,
        currency: "INR",
      }),
    },

    taxes: {
      type: moneySchema,
      default: () => ({
        amount: 0,
        currency: "INR",
      }),
    },

    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    referenceNumber: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
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

// ========================
// Indexes
// ========================

investmentTransactionSchema.index({
  workspace: 1,
  investment: 1,
  transactionDate: -1,
});

investmentTransactionSchema.index({
  investment: 1,
  type: 1,
});

investmentTransactionSchema.index({
  workspace: 1,
  status: 1,
});

// ========================
// Virtuals
// ========================

investmentTransactionSchema.virtual("grossAmount").get(function () {
  return this.quantity * this.price.amount;
});

investmentTransactionSchema.virtual("netAmount").get(function () {
  return (
    this.grossAmount +
    this.brokerage.amount +
    this.taxes.amount
  );
});

const InvestmentTransaction =
  mongoose.models.InvestmentTransaction ||
  mongoose.model(
    "InvestmentTransaction",
    investmentTransactionSchema
  );

export default InvestmentTransaction;