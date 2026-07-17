import mongoose from "mongoose";

import generateSlug from "../utils/generateSlug.js";

import {
  WORKSPACE_TYPES,
  WORKSPACE_STATUS,
  WORKSPACE_COLORS,
  USER_CURRENCIES,
} from "../constants/index.js";

const { Schema } = mongoose;

const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    // Indexed (uniquely) in the Indexes section below.
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: WORKSPACE_TYPES,
      default: "personal",
      required: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    currency: {
      type: String,
      enum: USER_CURRENCIES,
      default: "INR",
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    locale: {
      type: String,
      default: "en-IN",
    },

    color: {
      type: String,
      enum: WORKSPACE_COLORS,
      default: "blue",
    },

    icon: {
      type: String,
      default: "wallet",
      trim: true,
    },

    status: {
      type: String,
      enum: WORKSPACE_STATUS,
      default: "active",
    },

    archived: {
      type: Boolean,
      default: false,
    },

    stats: {
      memberCount: {
        type: Number,
        default: 1,
        min: 1,
      },

      accountCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      transactionCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// ===========================
// Indexes
// ===========================

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ slug: 1 }, { unique: true });
workspaceSchema.index({ type: 1 });
workspaceSchema.index({ status: 1 });
workspaceSchema.index({ createdAt: -1 });

// ===========================
// Virtuals
// ===========================

workspaceSchema.virtual("isArchived").get(function () {
  return this.archived;
});

workspaceSchema.virtual("displayName").get(function () {
  return `${this.name} (${this.type})`;
});

// ===========================
// Middleware
// ===========================

workspaceSchema.pre("validate", async function () {
  if (!this.isModified("name")) return;

  this.slug = await generateSlug(
    "Workspace",
    this.name,
    this._id
  );
});

// ===========================
// Instance Methods
// ===========================

workspaceSchema.methods.isOwner = function (userId) {
  return this.owner.equals(userId);
};

workspaceSchema.methods.archive = async function () {
  this.archived = true;
  this.status = "archived";
  return this.save();
};

workspaceSchema.methods.restore = async function () {
  this.archived = false;
  this.status = "active";
  return this.save();
};

// ===========================
// Static Methods
// ===========================

workspaceSchema.statics.findByOwner = function (ownerId) {
  return this.find({
    owner: ownerId,
    archived: false,
  });
};

workspaceSchema.statics.findBySlug = function (slug) {
  return this.findOne({
    slug,
    archived: false,
  });
};

// ===========================

const Workspace =
  mongoose.models.Workspace ||
  mongoose.model("Workspace", workspaceSchema);

export default Workspace;