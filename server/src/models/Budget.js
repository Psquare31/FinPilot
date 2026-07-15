import mongoose from "mongoose";

import {
  BUDGET_PERIODS,
} from "../constants/index.js";

import moneySchema from "./schemas/Money.js";
import auditSchema from "./schemas/Audit.js";

const { Schema } = mongoose;

const budgetSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    period: {
      type: String,
      enum: BUDGET_PERIODS,
      default: "monthly",
    },

    budgetAmount: {
      type: moneySchema,
      required: true,
    },

    spentAmount: {
      type: moneySchema,
      default: () => ({
        amount: 0,
        currency: "INR",
      }),
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    rollover: {
      type: Boolean,
      default: false,
    },

    alertThreshold: {
      type: Number,
      default: 80,
      min: 1,
      max: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
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

// ==========================
// Indexes
// ==========================

budgetSchema.index({
  workspace: 1,
  category: 1,
  period: 1,
});

budgetSchema.index({
  workspace: 1,
  startDate: 1,
});

budgetSchema.index({
  isActive: 1,
});

// ==========================
// Virtuals
// ==========================

budgetSchema.virtual("remainingAmount").get(function () {
  return (
    this.budgetAmount.amount -
    this.spentAmount.amount
  );
});

budgetSchema.virtual("percentageUsed").get(function () {
  if (this.budgetAmount.amount === 0) return 0;

  return (
    (this.spentAmount.amount /
      this.budgetAmount.amount) *
    100
  );
});

budgetSchema.virtual("isExceeded").get(function () {
  return (
    this.spentAmount.amount >
    this.budgetAmount.amount
  );
});

// ==========================
// Middleware
// ==========================

budgetSchema.pre("validate", async function () {
  if (this.startDate >= this.endDate) {
    throw new Error(
      "End date must be after start date."
    );
  }
});

// ==========================

const Budget =
  mongoose.models.Budget ||
  mongoose.model("Budget", budgetSchema);

export default Budget;