import mongoose from "mongoose";

import {
  DEBT_TYPES,
  DEBT_STATUS,
  REPAYMENT_FREQUENCIES,
} from "../constants/index.js";

import moneySchema from "./schemas/Money.js";
import auditSchema from "./schemas/Audit.js";

const { Schema } = mongoose;

const debtSchema = new Schema(
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

    lender: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: DEBT_TYPES,
      required: true,
    },

    principalAmount: {
      type: moneySchema,
      required: true,
    },

    outstandingAmount: {
      type: moneySchema,
      required: true,
    },

    interestRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    emiAmount: {
      type: moneySchema,
      required: true,
    },

    repaymentFrequency: {
      type: String,
      enum: REPAYMENT_FREQUENCIES,
      default: "monthly",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    nextDueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: DEBT_STATUS,
      default: "active",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // The service layer already filters and writes these, and every sibling
    // model declares them — but they were missing here, so strictQuery stripped
    // the conditions from every query and archiveDebt/restoreDebt wrote fields
    // that were silently discarded.
    isArchived: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
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

// ======================================
// Indexes
// ======================================

debtSchema.index({
  workspace: 1,
  status: 1,
});

debtSchema.index({
  workspace: 1,
  nextDueDate: 1,
});

debtSchema.index({
  workspace: 1,
  lender: 1,
});

debtSchema.index({
  workspace: 1,
  type: 1,
});

// ======================================
// Virtuals
// ======================================

debtSchema.virtual("amountPaid").get(function () {
  return (
    this.principalAmount.amount -
    this.outstandingAmount.amount
  );
});

debtSchema.virtual("progressPercentage").get(function () {
  if (this.principalAmount.amount === 0) return 0;

  return (
    (this.amountPaid /
      this.principalAmount.amount) *
    100
  );
});

debtSchema.virtual("isCompleted").get(function () {
  return this.status === "closed";
});

// ======================================
// Middleware
// ======================================

debtSchema.pre("validate", async function () {
  if (this.endDate <= this.startDate) {
    throw new Error(
      "End date must be after start date."
    );
  }
});

// ======================================

const Debt =
  mongoose.models.Debt ||
  mongoose.model("Debt", debtSchema);

export default Debt;