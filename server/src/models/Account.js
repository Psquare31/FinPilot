import mongoose from "mongoose";

import {
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
  USER_CURRENCIES,
  ACCOUNT_COLORS,
  ACCOUNT_ICONS,
} from "../constants/index.js";

import generateSlug from "../utils/generateSlug.js";

const { Schema } = mongoose;

const accountSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ACCOUNT_TYPES,
      required: true,
    },

    institution: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    openingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      enum: USER_CURRENCIES,
      default: "INR",
    },

    color: {
      type: String,
      enum: ACCOUNT_COLORS,
      default: "blue",
    },

    icon: {
      type: String,
      enum: ACCOUNT_ICONS,
      default: "wallet",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },

    status: {
      type: String,
      enum: ACCOUNT_STATUS,
      default: "active",
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    lastReconciledAt: {
      type: Date,
      default: null,
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

// ===================================
// Indexes
// ===================================

accountSchema.index(
  {
    workspace: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

accountSchema.index({ workspace: 1 });
accountSchema.index({ slug: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ type: 1 });

// ===================================
// Virtuals
// ===================================

accountSchema.virtual("maskedAccountNumber").get(function () {
  if (!this.accountNumber) return "";

  return this.accountNumber.slice(-4).padStart(
    this.accountNumber.length,
    "*"
  );
});

// ===================================
// Middleware
// ===================================

accountSchema.pre("validate", async function () {
  if (!this.isModified("name")) return;

  this.slug = await generateSlug(
    "Account",
    this.name,
    this._id
  );
});

// ===================================
// Instance Methods
// ===================================

accountSchema.methods.archive = async function () {
  this.isArchived = true;
  this.status = "inactive";
  return this.save();
};

accountSchema.methods.restore = async function () {
  this.isArchived = false;
  this.status = "active";
  return this.save();
};

accountSchema.methods.reconcile = async function (
  newBalance
) {
  this.balance = newBalance;
  this.lastReconciledAt = new Date();

  return this.save();
};

// ===================================
// Static Methods
// ===================================

accountSchema.statics.findWorkspaceAccounts =
  function (workspaceId) {
    return this.find({
      workspace: workspaceId,
      isArchived: false,
    }).sort({
      createdAt: -1,
    });
  };

accountSchema.statics.findActiveAccounts =
  function (workspaceId) {
    return this.find({
      workspace: workspaceId,
      status: "active",
      isArchived: false,
    });
  };

const Account =
  mongoose.models.Account ||
  mongoose.model("Account", accountSchema);

export default Account;