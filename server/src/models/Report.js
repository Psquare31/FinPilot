import mongoose from "mongoose";

import {
  REPORT_TYPES,
  REPORT_STATUS,
  REPORT_FORMATS,
} from "../constants/enums.js";

const { Schema } = mongoose;

const reportFileSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      default: "",
      trim: true,
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const reportSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    type: {
      type: String,
      enum: REPORT_TYPES,
      required: true,
    },

    format: {
      type: String,
      enum: REPORT_FORMATS,
      default: "pdf",
    },

    status: {
      type: String,
      enum: REPORT_STATUS,
      default: "pending",
    },

    filters: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    file: {
      type: reportFileSchema,
      default: null,
    },

    generatedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: "",
      trim: true,
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

// =================================
// Indexes
// =================================

reportSchema.index({
  workspace: 1,
  type: 1,
});

reportSchema.index({
  workspace: 1,
  generatedBy: 1,
});

reportSchema.index({
  status: 1,
});

reportSchema.index({
  generatedAt: -1,
});

reportSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

// =================================
// Virtuals
// =================================

reportSchema.virtual("isReady").get(function () {
  return this.status === "completed";
});

// =================================
// Instance Methods
// =================================

reportSchema.methods.markCompleted = async function (
  file
) {
  this.file = file;
  this.status = "completed";
  this.generatedAt = new Date();

  return this.save();
};

reportSchema.methods.markFailed = async function (
  reason
) {
  this.status = "failed";
  this.failureReason = reason;

  return this.save();
};

// =================================

const Report =
  mongoose.models.Report ||
  mongoose.model("Report", reportSchema);

export default Report;