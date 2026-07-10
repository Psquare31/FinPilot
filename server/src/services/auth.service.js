import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

import ApiError from "../utils/ApiError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getTokenExpiry,
} from "../utils/token.js";

// =======================================================
// Issue a fresh access/refresh pair and persist the
// refresh token so it can be validated and revoked later.
// =======================================================
const issueTokens = async (user, context = {}) => {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
  });

  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    type: "refresh",
  });

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: getTokenExpiry(refreshToken),
    deviceName: context.deviceName || "Unknown Device",
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return { accessToken, refreshToken };
};

// =======================================================
// Register a new user and log them in.
// =======================================================
const register = async (data, context = {}) => {
  const existing = await User.findOne({ email: data.email });

  if (existing) {
    throw new ApiError(
      409,
      "An account with this email already exists.",
      [],
      "EMAIL_TAKEN"
    );
  }

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
  });

  const tokens = await issueTokens(user, context);

  return { user, ...tokens };
};

// =======================================================
// Authenticate with email + password.
// =======================================================
const login = async ({ email, password }, context = {}) => {
  const user = await User.findByEmail(email);

  const invalidCredentials = new ApiError(
    401,
    "Invalid email or password.",
    [],
    "INVALID_CREDENTIALS"
  );

  if (!user) {
    throw invalidCredentials;
  }

  if (user.isLocked) {
    throw new ApiError(
      423,
      "Account temporarily locked due to too many failed attempts. Try again later.",
      [],
      "ACCOUNT_LOCKED"
    );
  }

  const matches = await user.comparePassword(password);

  if (!matches) {
    await user.incrementLoginAttempts();
    throw invalidCredentials;
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Account is not active.", [], "ACCOUNT_INACTIVE");
  }

  await user.resetLoginAttempts();

  const tokens = await issueTokens(user, context);

  return { user, ...tokens };
};

// =======================================================
// Rotate a refresh token: validate the presented token,
// revoke it, and issue a new pair.
// =======================================================
const refresh = async (token, context = {}) => {
  const invalidToken = new ApiError(
    401,
    "Invalid or expired refresh token.",
    [],
    "INVALID_REFRESH_TOKEN"
  );

  if (!token) {
    throw invalidToken;
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw invalidToken;
  }

  const stored = await RefreshToken.findValidToken(token);

  if (!stored) {
    throw invalidToken;
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw invalidToken;
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Account is not active.", [], "ACCOUNT_INACTIVE");
  }

  await stored.revoke("Rotated on refresh");

  const tokens = await issueTokens(user, context);

  return { user, ...tokens };
};

// =======================================================
// Revoke a single refresh token (logout on this device).
// =======================================================
const logout = async (token) => {
  if (!token) {
    return;
  }

  const stored = await RefreshToken.findValidToken(token);

  if (stored) {
    await stored.revoke("User logout");
  }
};

// =======================================================
// Revoke every active refresh token for a user
// (logout on all devices).
// =======================================================
const logoutAll = async (userId) => {
  await RefreshToken.updateMany(
    { user: userId, revoked: false },
    {
      $set: {
        revoked: true,
        revokedAt: new Date(),
        revokeReason: "Logout all devices",
      },
    }
  );
};

export default {
  register,
  login,
  refresh,
  logout,
  logoutAll,
};
