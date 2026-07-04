import mongoose from "mongoose";

const { Schema } = mongoose;

const refreshTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    deviceName: {
      type: String,
      default: "Unknown Device",
      trim: true,
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

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revoked: {
      type: Boolean,
      default: false,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokeReason: {
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

// ===========================
// Indexes
// ===========================

refreshTokenSchema.index({ user: 1 });

refreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

// ===========================
// Virtuals
// ===========================

refreshTokenSchema.virtual("isExpired").get(function () {
  return this.expiresAt <= new Date();
});

refreshTokenSchema.virtual("isValid").get(function () {
  return !this.revoked && this.expiresAt > new Date();
});

// ===========================
// Instance Methods
// ===========================

refreshTokenSchema.methods.revoke = async function (
  reason = "Token revoked"
) {
  this.revoked = true;
  this.revokedAt = new Date();
  this.revokeReason = reason;

  await this.save();
};

// ===========================
// Static Methods
// ===========================

refreshTokenSchema.statics.findValidToken = function (token) {
  return this.findOne({
    token,
    revoked: false,
    expiresAt: {
      $gt: new Date(),
    },
  }).select("+token");
};

const RefreshToken =
  mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;