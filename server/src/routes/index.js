import { Router } from "express";
import mongoose from "mongoose";

import ApiResponse from "../utils/ApiResponse.js";

const router = Router();

// ======================================================
// Health check — used by uptime monitoring and load balancers.
// ======================================================

router.get("/health", (req, res) => {
    const dbState = mongoose.connection.readyState; // 1 = connected

    res.status(200).json(
        new ApiResponse(
            200,
            {
                uptime: process.uptime(),
                database: dbState === 1 ? "connected" : "disconnected",
                timestamp: new Date().toISOString(),
            },
            "FinPilot API is healthy."
        )
    );
});

// ======================================================
// Feature module routers get mounted here as they are built,
// e.g. router.use("/auth", authRoutes);
// ======================================================

export default router;
