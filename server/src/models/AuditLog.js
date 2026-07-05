import mongoose from "mongoose";

import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
} from "../constants/enums.js";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
      index: true,
    },

    resource: {
      type: String,
      enum: AUDIT_RESOURCES,
      required: true,
      index: true,
    },

    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    before: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    after: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

// ==================================
// Indexes
// ==================================

auditLogSchema.index({
  workspace: 1,
  createdAt: -1,
});

auditLogSchema.index({
  user: 1,
  createdAt: -1,
});

auditLogSchema.index({
  resource: 1,
  resourceId: 1,
});

auditLogSchema.index({
  action: 1,
});

// ==================================
// Static Methods
// ==================================

auditLogSchema.statics.findResourceHistory = function (
  resource,
  resourceId
) {
  return this.find({
    resource,
    resourceId,
  }).sort({
    createdAt: -1,
  });
};

auditLogSchema.statics.findUserActivity = function (
  userId
) {
  return this.find({
    user: userId,
  }).sort({
    createdAt: -1,
  });
};

// ==================================

const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;