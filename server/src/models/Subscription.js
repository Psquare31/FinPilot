import mongoose from "mongoose";

import {
  SUBSCRIPTION_STATUS,
  BILLING_CYCLES,
  PAYMENT_METHODS,
} from "../constants/index.js";

import moneySchema from "./schemas/Money.js";
import auditSchema from "./schemas/Audit.js";

const { Schema } = mongoose;

const subscriptionSchema = new Schema(
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

    provider: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    logo: {
      publicId: {
        type: String,
        default: "",
      },

      url: {
        type: String,
        default: "",
      },
    },

    razorpay: {
        orderId: {
            type: String,
            default: "",
        },

        paymentId: {
            type: String,
            default: "",
        },

        subscriptionId: {
            type: String,
            default: "",
        },

        customerId: {
            type: String,
            default: "",
        },

        planId: {
            type: String,
            default: "",
        },
    },

    cancelledAt: {
        type: Date,
        default: null,
    },

    amount: {
      type: moneySchema,
      required: true,
    },

    billingCycle: {
      type: String,
      enum: BILLING_CYCLES,
      default: "monthly",
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "upi",
    },

    autoPay: {
      type: Boolean,
      default: false,
    },

    reminderDays: {
      type: Number,
      default: 3,
      min: 0,
      max: 30,
    },

    nextBillingDate: {
      type: Date,
      required: true,
    },

    lastBillingDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: SUBSCRIPTION_STATUS,
      default: "active",
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

// ======================================
// Indexes
// ======================================

subscriptionSchema.index({
  workspace: 1,
  status: 1,
});

subscriptionSchema.index({
  workspace: 1,
  nextBillingDate: 1,
});

subscriptionSchema.index({
  workspace: 1,
  billingCycle: 1,
});

subscriptionSchema.index({
  workspace: 1,
  provider: 1,
});

subscriptionSchema.index({
  account: 1,
});

// ======================================
// Virtuals
// ======================================

subscriptionSchema.virtual("isDue").get(function () {
  return (
    this.status === "active" &&
    this.nextBillingDate <= new Date()
  );
});

subscriptionSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

// ======================================
// Middleware
// ======================================

subscriptionSchema.pre("validate", function (next) {
  if (
    this.lastBillingDate &&
    this.nextBillingDate <= this.lastBillingDate
  ) {
    return next(
      new Error(
        "Next billing date must be after the last billing date."
      )
    );
  }

  next();
});

subscriptionSchema.pre("save", function (next) {
    if (this.status === "cancelled") {
        this.cancelledAt = new Date();
    }

    next();
});

// ======================================
// Instance Methods
// ======================================

subscriptionSchema.methods.pause = async function () {
  this.status = "paused";
  return this.save();
};

subscriptionSchema.methods.resume = async function () {
  this.status = "active";
  return this.save();
};

subscriptionSchema.methods.cancel = async function () {
  this.status = "cancelled";
  return this.save();
};

// ======================================
// Static Methods
// ======================================

subscriptionSchema.statics.findWorkspaceSubscriptions = function (
  workspaceId
) {
  return this.find({
    workspace: workspaceId,
  }).sort({
    nextBillingDate: 1,
  });
};

subscriptionSchema.statics.findDueSubscriptions = function (
  workspaceId
) {
  return this.find({
    workspace: workspaceId,
    status: "active",
    nextBillingDate: {
      $lte: new Date(),
    },
  }).sort({
    nextBillingDate: 1,
  });
};

subscriptionSchema.statics.findActiveSubscriptions = function (
    workspaceId
) {
    return this.find({
        workspace: workspaceId,
        status: "active",
    });
};

// ======================================

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model(
    "Subscription",
    subscriptionSchema
  );

export default Subscription;