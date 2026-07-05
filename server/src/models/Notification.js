import mongoose from "mongoose";

import {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
} from "../constants/enums.js";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: "medium",
    },

    channel: {
      type: String,
      enum: NOTIFICATION_CHANNELS,
      default: "in_app",
    },

    status: {
      type: String,
      enum: NOTIFICATION_STATUS,
      default: "unread",
    },

    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    actionUrl: {
      type: String,
      default: "",
      trim: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    readAt: {
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

// ============================
// Indexes
// ============================

notificationSchema.index({
  workspace: 1,
  user: 1,
  status: 1,
});

notificationSchema.index({
  user: 1,
  createdAt: -1,
});

notificationSchema.index({
  expiresAt: 1,
});

// Automatically delete expired notifications
notificationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

// ============================
// Virtuals
// ============================

notificationSchema.virtual("isRead").get(function () {
  return this.status === "read";
});

// ============================
// Instance Methods
// ============================

notificationSchema.methods.markAsRead = async function () {
  this.status = "read";
  this.readAt = new Date();

  return this.save();
};

notificationSchema.methods.markAsUnread = async function () {
  this.status = "unread";
  this.readAt = null;

  return this.save();
};

// ============================
// Static Methods
// ============================

notificationSchema.statics.findUnread = function (userId) {
  return this.find({
    user: userId,
    status: "unread",
  }).sort({
    createdAt: -1,
  });
};

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;