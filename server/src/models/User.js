import mongoose from "mongoose";
import bcrypt from "bcrypt";

import {
  USER_THEMES,
  USER_CURRENCIES,
  ACCOUNT_STATUS,
} from "../constants/index.js";

const { Schema } = mongoose;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

const avatarSchema = new Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    avatar: {
      type: avatarSchema,
      default: () => ({}),
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      match: [/^[0-9]{10,15}$/, "Invalid phone number"],
    },

    occupation: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    monthlyIncome: {
      type: Number,
      default: 0,
      min: 0,
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

    theme: {
      type: String,
      enum: USER_THEMES,
      default: "system",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ACCOUNT_STATUS,
      default: "active",
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
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
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// =======================
// Indexes
// =======================

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// =======================
// Virtuals
// =======================

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// =======================
// Middleware
// =======================

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordChangedAt = new Date(Date.now() - 1000);
});

// =======================
// Instance Methods
// =======================

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementLoginAttempts = async function () {
  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME);
  }

  await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  this.lastLogin = new Date();

  await this.save();
};

// =======================
// Static Methods
// =======================

userSchema.statics.findByEmail = function (email) {
  return this.findOne({
    email: email.toLowerCase(),
  }).select("+password");
};

// ===========================

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;