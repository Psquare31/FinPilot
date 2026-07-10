import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/token.js";

// =======================================================
// Extract a bearer access token from the Authorization
// header, falling back to an httpOnly cookie.
// =======================================================
const extractToken = (req) => {
  const header = req.headers.authorization || "";

  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

// =======================================================
// requireAuth: verify the access token, load the user,
// and attach it to req.user. Rejects requests whose token
// is missing, invalid, expired, or predates a password
// change / account deactivation.
// =======================================================
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(
      401,
      "Authentication required.",
      [],
      "UNAUTHENTICATED"
    );
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    const expired = error?.name === "TokenExpiredError";

    throw new ApiError(
      401,
      expired ? "Access token expired." : "Invalid access token.",
      [],
      expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN"
    );
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(401, "User no longer exists.", [], "UNAUTHENTICATED");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Account is not active.", [], "ACCOUNT_INACTIVE");
  }

  // Invalidate tokens issued before the most recent password change.
  if (user.passwordChangedAt && payload.iat) {
    const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);

    if (payload.iat < changedAt) {
      throw new ApiError(
        401,
        "Password was changed. Please log in again.",
        [],
        "TOKEN_STALE"
      );
    }
  }

  req.user = user;

  next();
});

export default requireAuth;
