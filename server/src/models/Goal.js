import mongoose from "mongoose";

import {
  GOAL_TYPES,
  GOAL_STATUS,
} from "../constants/enums.js";

import moneySchema from "./schemas/Money.js";
import auditSchema from "./schemas/Audit.js";

const { Schema } = mongoose;

const goalSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    linkedAccount: {
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

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: GOAL_TYPES,
      default: "custom",
    },

    targetAmount: {
      type: moneySchema,
      required: true,
    },

    currentAmount: {
      type: moneySchema,
      default: () => ({
        amount: 0,
        currency: "INR",
      }),
    },

    targetDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: GOAL_STATUS,
      default: "active",
    },

    priority: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },

    autoSave: {
      enabled: {
        type: Boolean,
        default: false,
      },

      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
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

// =========================
// Indexes
// =========================

goalSchema.index({
  workspace: 1,
  status: 1,
});

goalSchema.index({
  workspace: 1,
  targetDate: 1,
});

goalSchema.index({
  workspace: 1,
  type: 1,
});

// =========================
// Virtuals
// =========================

goalSchema.virtual("remainingAmount").get(function () {
  return (
    this.targetAmount.amount -
    this.currentAmount.amount
  );
});

goalSchema.virtual("progressPercentage").get(function () {
  if (this.targetAmount.amount === 0) return 0;

  return Math.min(
    100,
    (this.currentAmount.amount /
      this.targetAmount.amount) *
      100
  );
});

goalSchema.virtual("isCompleted").get(function () {
  return (
    this.currentAmount.amount >=
    this.targetAmount.amount
  );
});

// =========================
// Middleware
// =========================

goalSchema.pre("validate", function (next) {
  if (
    this.targetDate &&
    this.targetDate <= new Date()
  ) {
    return next(
      new Error("Target date must be in the future.")
    );
  }

  next();
});

const Goal =
  mongoose.models.Goal ||
  mongoose.model("Goal", goalSchema);

export default Goal;