import mongoose from "mongoose";
import bcrypt from "bcrypt";

import {
  USER_THEMES,
  USER_CURRENCIES,
  ACCOUNT_STATUS,
  AUTH_PROVIDERS,
} from "../constants/index.js";

const { Schema } = mongoose;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

// =======================
// Avatar Schema
// =======================

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

// =======================
// User Schema
// =======================

const userSchema = new Schema(
  {
    // Clerk User ID
    //
    // Indexed uniquely and sparsely in the Indexes section below. None of
    // `index`, `unique` or `sparse` may appear here as well: each of them
    // declares an index on the field, so a second definition of the same key
    // is emitted — which Mongoose warns about and MongoDB rejects outright
    // when the options differ.
    clerkId: {
      type: String,
      trim: true,
    },

    // Authentication Provider
    authProvider: {
      type: String,
      enum: AUTH_PROVIDERS,
      required: true,
      default: "EMAIL",
    },

    // Basic Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    // Not required: identity providers (Clerk email sign-up, some OAuth
    // providers) do not always supply a family name, and rejecting those
    // users would lock them out of the app entirely. `minlength` is omitted
    // for the same reason — it would reject the empty default.
    lastName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email",
      ],
    },

    // Only EMAIL users have passwords
    password: {
      type: String,
      minlength: 8,
      select: false,
      default: null,
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

    // Verification
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // Account Status
    status: {
      type: String,
      enum: ACCOUNT_STATUS,
      default: "active",
    },

    // First-time setup completed?
    isOnboardingComplete: {
      type: Boolean,
      default: false,
    },

    // Security
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    // Activity
    lastLoginAt: {
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

userSchema.index(
  { clerkId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

userSchema.index({ status: 1 });

userSchema.index({ authProvider: 1 });

userSchema.index({ createdAt: -1 });

// =======================
// Virtuals
// =======================

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("isLocked").get(function () {
  return !!(
    this.lockUntil &&
    this.lockUntil.getTime() > Date.now()
  );
});

// =======================
// Middleware
// =======================

// Mongoose 9 removed callback-style document middleware: `next` is never
// passed, so calling it throws "next is not a function" and no user — nor any
// document saved in the same operation — can be written. An async hook signals
// completion by returning and failure by throwing.
userSchema.pre("save", async function () {
  // Skip hashing if password doesn't exist (Google, Apple, Microsoft users)
  if (!this.password) return;

  // Skip if password wasn't modified
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordChangedAt = new Date(Date.now() - 1000);
});

// =======================
// Instance Methods
// =======================

// Compare Password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;

  return bcrypt.compare(candidatePassword, this.password);
};

// Increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  if (this.isLocked) {
    return this.updateOne({
      $inc: { failedLoginAttempts: 1 },
    });
  }

  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME);
  }

  await this.save();

  return this;
};

// Reset failed login attempts
userSchema.methods.resetLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();

  await this.save();

  return this;
};

// Update last login timestamp
userSchema.methods.updateLastLogin = async function () {
  this.lastLoginAt = new Date();

  await this.save();

  return this;
};

// Clerk Onboarding Status
userSchema.methods.completeOnboarding = async function () {
  this.isOnboardingComplete = true;

  await this.save();

  return this;
};

// =======================
// Static Methods
// =======================

// Find by Email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({
    email: email.toLowerCase(),
  }).select("+password");
};

//Find by Clerk ID
userSchema.statics.findByClerkId = function (clerkId) {
  return this.findOne({ clerkId });
};

// Find Active Users
userSchema.statics.findActiveUsers = function () {
  return this.find({
    status: "active",
  });
};

// Find Onboarded Users
userSchema.statics.findOnboardedUsers = function () {
  return this.find({
    isOnboardingComplete: true,
  });
};

//=======================

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;