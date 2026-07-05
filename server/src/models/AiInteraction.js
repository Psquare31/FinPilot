import mongoose from "mongoose";

import {
  AI_FEATURES,
  AI_INTERACTION_STATUS,
} from "../constants/index.js";

const { Schema } = mongoose;

const aiInteractionSchema = new Schema(
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

    feature: {
      type: String,
      enum: AI_FEATURES,
      required: true,
      index: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
      default: "gpt-5.5",
    },

    prompt: {
      type: String,
      required: true,
    },

    response: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: AI_INTERACTION_STATUS,
      default: "success",
    },

    tokens: {
      prompt: {
        type: Number,
        default: 0,
        min: 0,
      },

      completion: {
        type: Number,
        default: 0,
        min: 0,
      },

      total: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    responseTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    error: {
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

// =====================================
// Indexes
// =====================================

aiInteractionSchema.index({
  workspace: 1,
  createdAt: -1,
});

aiInteractionSchema.index({
  user: 1,
  createdAt: -1,
});

aiInteractionSchema.index({
  feature: 1,
});

aiInteractionSchema.index({
  model: 1,
});

aiInteractionSchema.index({
  status: 1,
});

// =====================================
// Virtuals
// =====================================

aiInteractionSchema.virtual("successful").get(function () {
  return this.status === "success";
});

// =====================================
// Static Methods
// =====================================

aiInteractionSchema.statics.findUserHistory = function (
  userId
) {
  return this.find({
    user: userId,
  }).sort({
    createdAt: -1,
  });
};

aiInteractionSchema.statics.findByFeature = function (
  feature
) {
  return this.find({
    feature,
  }).sort({
    createdAt: -1,
  });
};

// =====================================

const AiInteraction =
  mongoose.models.AiInteraction ||
  mongoose.model(
    "AiInteraction",
    aiInteractionSchema
  );

export default AiInteraction;