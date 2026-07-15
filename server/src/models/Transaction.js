import mongoose from "mongoose";

import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
} from "../constants/index.js";

import moneySchema from "./schemas/Money.js";
import locationSchema from "./schemas/Location.js";
import recurringSchema from "./schemas/Recurring.js";
import attachmentSchema from "./schemas/Attachment.js";
import merchantSchema from "./schemas/Merchant.js";
import aiSchema from "./schemas/AI.js";
import auditSchema from "./schemas/Audit.js";

const { Schema } = mongoose;

const transactionSchema = new Schema(
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
      required: true,
    },

    transferAccount: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },

    status: {
      type: String,
      enum: TRANSACTION_STATUS,
      default: "completed",
    },

    money: {
      type: moneySchema,
      required: true,
    },

    merchant: {
      type: merchantSchema,
      default: () => ({}),
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "bank_transfer",
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    location: {
      type: locationSchema,
      default: () => ({}),
    },

    recurring: {
      type: recurringSchema,
      default: () => ({}),
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    ai: {
      type: aiSchema,
      default: () => ({}),
    },

    audit: {
      type: auditSchema,
      required: true,
    },

    receiptNumber: {
      type: String,
      default: "",
      trim: true,
    },

    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    isSplit: {
      type: Boolean,
      default: false,
    },

    parentTransaction: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

// =========================
// Indexes
// =========================

transactionSchema.index({ workspace: 1, transactionDate: -1 });

transactionSchema.index({ workspace: 1, account: 1 });

transactionSchema.index({ workspace: 1, category: 1 });

transactionSchema.index({ workspace: 1, type: 1 });

transactionSchema.index({ workspace: 1, status: 1 });

transactionSchema.index({ workspace: 1, isDeleted: 1 });

transactionSchema.index({ "merchant.name": 1 });

transactionSchema.index({ tags: 1 });

// =========================
// Virtuals
// =========================

transactionSchema.virtual("isTransfer").get(function () {
  return this.type === "transfer";
});

transactionSchema.virtual("isRecurring").get(function () {
  return this.recurring.enabled;
});

transactionSchema.virtual("hasAttachments").get(function () {
  return this.attachments.length > 0;
});

// =========================
// Middleware
// =========================

transactionSchema.pre("validate", async function () {
  if (
    this.type === "transfer" &&
    (!this.transferAccount ||
      this.transferAccount.equals(this.account))
  ) {
    throw new Error(
      "Transfer transactions require a different destination account."
    );
  }
});

// =========================
// Static Methods
// =========================

transactionSchema.statics.findWorkspaceTransactions = function (
  workspaceId
) {
  return this.find({
    workspace: workspaceId,
    isDeleted: false,
  });
};

// =========================

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default Transaction;