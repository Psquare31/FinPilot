import { getAuth } from "@clerk/express";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

import { clerkClient } from "../config/clerk/clerk.js";

import authService from "../services/auth.service.js";

const authenticate = asyncHandler(async (req, res, next) => {
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