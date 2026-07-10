import jwt from "jsonwebtoken";

import env from "../config/env/index.js";

// =======================================================
// Access / refresh JWT helpers.
//
// Access tokens are short-lived and sent on every request.
// Refresh tokens are long-lived, persisted in the RefreshToken
// collection, and rotated on use.
// =======================================================

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

// Resolve a token's absolute expiry as a Date, for persisting
// alongside the stored refresh token.
export const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);

  if (!decoded?.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
};
