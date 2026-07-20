import { Router } from "express";
import mongoose from "mongoose";

import ApiResponse from "../utils/ApiResponse.js";
import env from "../config/env/index.js";

const router = Router();

// ======================================================
// Public runtime config.
//
// Lets the client discover how the API expects to be authenticated, so a
// single frontend build works whether the server runs in DEMO_AUTH mode
// (no sign-in at all) or with the real Clerk flow. Deliberately public —
// it exposes no secrets, only which mode is active.
// ======================================================

router.get("/config", (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        demoAuth: env.DEMO_AUTH,
        clerkEnabled: Boolean(env.CLERK_SECRET_KEY),
      },
      "Config fetched successfully."
    )
  );
});

// ======================================================
// Health check — used by uptime monitoring and load balancers.
// ======================================================

router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        uptime: process.uptime(),
        database:
          dbState === 1
            ? "connected"
            : "disconnected",
        timestamp: new Date().toISOString(),
      },
      "FinPilot API is healthy."
    )
  );
});

export default router;