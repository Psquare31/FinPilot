import mongoose from "mongoose";

import {
  WORKSPACE_ROLES,
  MEMBER_STATUS,
} from "../constants/index.js";

import {
  DEFAULT_ROLE_PERMISSIONS,
} from "../constants/permissions.js";

const { Schema } = mongoose;

const workspaceMemberSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: WORKSPACE_ROLES,
      default: "member",
      required: true,
    },

    permissions: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: MEMBER_STATUS,
      default: "invited",
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    joinedAt: {
      type: Date,
      default: null,
    },

    lastActive: {
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

// ==================================
// Indexes
// ==================================

workspaceMemberSchema.index(
  {
    workspace: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

workspaceMemberSchema.index({
  workspace: 1,
  role: 1,
});

workspaceMemberSchema.index({
  user: 1,
});

workspaceMemberSchema.index({
  status: 1,
});

// ==================================
// Virtuals
// ==================================

workspaceMemberSchema.virtual("isOwner").get(function () {
  return this.role === "owner";
});

workspaceMemberSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

// ==================================
// Middleware
// ==================================

workspaceMemberSchema.pre("save", function (next) {
  if (
    this.isModified("role") &&
    (!this.permissions || this.permissions.length === 0)
  ) {
    this.permissions =
      DEFAULT_ROLE_PERMISSIONS[this.role] ?? [];
  }

  if (
    this.status === "active" &&
    !this.joinedAt
  ) {
    this.joinedAt = new Date();
  }

  next();
});

// ==================================
// Instance Methods
// ==================================

workspaceMemberSchema.methods.hasPermission = function (
  permission
) {
  return this.permissions.includes(permission);
};

workspaceMemberSchema.methods.updateLastActive =
  async function () {
    this.lastActive = new Date();
    await this.save();
  };

// ==================================
// Static Methods
// ==================================

workspaceMemberSchema.statics.findWorkspaceMembers =
  function (workspaceId) {
    return this.find({
      workspace: workspaceId,
      status: "active",
    }).populate("user");
  };

workspaceMemberSchema.statics.findUserWorkspaces =
  function (userId) {
    return this.find({
      user: userId,
      status: "active",
    }).populate("workspace");
  };

// ==================================

const WorkspaceMember =
  mongoose.models.WorkspaceMember ||
  mongoose.model(
    "WorkspaceMember",
    workspaceMemberSchema
  );

export default WorkspaceMember;