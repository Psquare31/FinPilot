import { getAuth } from "@clerk/express";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

import env from "../config/env/index.js";
import { clerkClient } from "../config/clerk/clerk.js";

import authService from "../services/auth.service.js";
import User from "../models/User.js";

// ======================================================
// Demo user
//
// When DEMO_AUTH is enabled, every request is authenticated as a
// single fixed user that is created on demand in MongoDB. This lets
// the app run — and be demoed live — without a Clerk account or any
// sign-in flow. It is intentionally scoped to demo/evaluation use.
// ======================================================

const DEMO_EMAIL = "demo@finpilot.app";

let demoUserPromise = null;

const getDemoUser = async () => {
    let user = await User.findOne({ email: DEMO_EMAIL });

    if (!user) {
        user = await User.create({
            clerkId: "demo-user",
            authProvider: "EMAIL",
            firstName: "Demo",
            lastName: "User",
            email: DEMO_EMAIL,
            emailVerified: true,
            lastLoginAt: new Date(),
        });
    }

    return user;
};

const authenticate = asyncHandler(async (req, res, next) => {
    // ---- Demo mode: skip Clerk entirely ----
    if (env.DEMO_AUTH) {
        // Cache the lookup so we don't hit Mongo on every request, but
        // fall back to a fresh lookup if the cached promise ever rejects.
        if (!demoUserPromise) {
            demoUserPromise = getDemoUser().catch((error) => {
                demoUserPromise = null;
                throw error;
            });
        }

        req.user = await demoUserPromise;

        return next();
    }

    // Get authenticated Clerk session
    const { userId } = getAuth(req);

    if (!userId) {
        throw new ApiError(
            401,
            "Authentication required.",
            [],
            "UNAUTHORIZED"
        );
    }

    // Fetch latest Clerk user
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
        throw new ApiError(
            401,
            "Unable to verify authenticated user.",
            [],
            "INVALID_SESSION"
        );
    }

    // Synchronize MongoDB user
    const user = await authService.syncUser(clerkUser);

    // Attach authenticated user
    req.user = user;

    req.clerkUser = clerkUser;

    next();
});

export default authenticate;
