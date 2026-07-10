import authService from "../services/auth.service.js";

import env from "../config/env/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getTokenExpiry } from "../utils/token.js";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/v1/auth";

// Build request context stored alongside each refresh token.
const getContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent") || "",
  deviceName: req.get("user-agent") || "Unknown Device",
});

// Read the presented refresh token from the cookie or body.
const getRefreshToken = (req) =>
  req.cookies?.[REFRESH_COOKIE] ||
  req.validatedData?.body?.refreshToken ||
  req.body?.refreshToken ||
  null;

const setRefreshCookie = (res, refreshToken) => {
  const expires = getTokenExpiry(refreshToken);

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
    ...(expires ? { expires } : {}),
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
  });
};

// Register
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.validatedData.body,
    getContext(req)
  );

  setRefreshCookie(res, refreshToken);

  return res.status(201).json(
    new ApiResponse(
      201,
      { user, accessToken },
      "Account created successfully."
    )
  );
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.validatedData.body,
    getContext(req)
  );

  setRefreshCookie(res, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, { user, accessToken }, "Logged in successfully.")
  );
});

// Refresh access token
export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(
    getRefreshToken(req),
    getContext(req)
  );

  setRefreshCookie(res, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, { user, accessToken }, "Token refreshed.")
  );
});

// Logout (current device)
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(getRefreshToken(req));

  clearRefreshCookie(res);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully."));
});

// Logout everywhere
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user._id);

  clearRefreshCookie(res);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out from all devices."));
});

// Current user
export const me = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, "Current user fetched."));
});
