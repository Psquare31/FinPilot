import { Router } from "express";

import authController from "../controllers/auth.controller.js";

import validate from "../middlewares/validate.js";
import requireAuth from "../middlewares/authenticate.js";

import {
    updateProfileSchema,
    completeOnboardingSchema,
} from "../validators/auth.validator.js";

const router = Router();

// ======================================================
// Protected Routes
// ======================================================

router.get(
    "/me",
    requireAuth,
    authController.me
);

router.patch(
    "/profile",
    requireAuth,
    validate(updateProfileSchema),
    authController.updateProfile
);

router.patch(
    "/onboarding",
    requireAuth,
    validate(completeOnboardingSchema),
    authController.completeOnboarding
);

router.delete(
    "/account",
    requireAuth,
    authController.deleteAccount
);

export default router;