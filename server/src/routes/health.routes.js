import { Router } from "express";
import mongoose from "mongoose";

import ApiResponse from "../utils/ApiResponse.js";

const router = Router();

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