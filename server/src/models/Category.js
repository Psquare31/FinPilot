import mongoose from "mongoose";

import {
  CATEGORY_TYPES,
} from "../constants/index.js";

import generateSlug from "../utils/generateSlug.js";

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: CATEGORY_TYPES,
      required: true,
    },

    icon: {
      type: String,
      default: "circle",
      trim: true,
    },

    color: {
      type: String,
      default: "#3B82F6",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isArchived: {
      type: Boolean,
      default: false,
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

categorySchema.index(
  {
    workspace: 1,
    name: 1,
    type: 1,
  },
  {
    unique: true,
  }
);

categorySchema.index({
  workspace: 1,
});

categorySchema.index({
  slug: 1,
});

categorySchema.index({
  type: 1,
});

// ===================================
// Virtuals
// ===================================

categorySchema.virtual("displayName").get(function () {
  return `${this.icon} ${this.name}`;
});

// ===================================
// Middleware
// ===================================

categorySchema.pre("validate", async function () {
  if (!this.isModified("name")) return;

  this.slug = await generateSlug(
    "Category",
    this.name,
    this._id
  );
});

// ===================================
// Instance Methods
// ===================================

categorySchema.methods.archive = async function () {
  this.isArchived = true;
  return this.save();
};

categorySchema.methods.restore = async function () {
  this.isArchived = false;
  return this.save();
};

// ===================================
// Static Methods
// ===================================

categorySchema.statics.findWorkspaceCategories = function (
  workspaceId
) {
  return this.find({
    workspace: workspaceId,
    isArchived: false,
  }).sort({
    name: 1,
  });
};

categorySchema.statics.findIncomeCategories = function (
  workspaceId
) {
  return this.find({
    workspace: workspaceId,
    type: "income",
    isArchived: false,
  });
};

categorySchema.statics.findExpenseCategories = function (
  workspaceId
) {
  return this.find({
    workspace: workspaceId,
    type: "expense",
    isArchived: false,
  });
};

const Category =
  mongoose.models.Category ||
  mongoose.model("Category", categorySchema);

export default Category;