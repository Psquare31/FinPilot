import mongoose from "mongoose";
import crypto from "crypto";

import {
  WORKSPACE_ROLES,
  INVITATION_STATUS,
} from "../constants/enums.js";

const { Schema } = mongoose;

const invitationSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    invitedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email",
      ],
    },

    role: {
      type: String,
      enum: WORKSPACE_ROLES,
      default: "member",
    },

    token: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: INVITATION_STATUS,
      default: "pending",
    },

    message: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
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

// =============================
// Indexes
// =============================

invitationSchema.index({
  workspace: 1,
  email: 1,
});

invitationSchema.index({
  token: 1,
});

invitationSchema.index({
  status: 1,
});

invitationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

// =============================
// Virtuals
// =============================

invitationSchema.virtual("isExpired").get(function () {
  return this.expiresAt <= new Date();
});

invitationSchema.virtual("isPending").get(function () {
  return this.status === "pending";
});

// =============================
// Middleware
// =============================

invitationSchema.pre("validate", function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString("hex");
  }

  if (!this.expiresAt) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    this.expiresAt = expiry;
  }

  next();
});

// =============================
// Instance Methods
// =============================

invitationSchema.methods.accept = async function () {
  this.status = "accepted";
  this.acceptedAt = new Date();

  return this.save();
};

invitationSchema.methods.reject = async function () {
  this.status = "rejected";
  this.rejectedAt = new Date();

  return this.save();
};

invitationSchema.methods.cancel = async function () {
  this.status = "cancelled";

  return this.save();
};

// =============================
// Static Methods
// =============================

invitationSchema.statics.findPendingByEmail = function (
  email
) {
  return this.find({
    email: email.toLowerCase(),
    status: "pending",
    expiresAt: {
      $gt: new Date(),
    },
  });
};

// =============================

const Invitation =
  mongoose.models.Invitation ||
  mongoose.model("Invitation", invitationSchema);

export default Invitation;