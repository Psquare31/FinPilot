import { Router } from "express";

import {
  createSubscription,
  getSubscription,
  updateSubscription,
  changePlan,
  cancelSubscription,
  resumeSubscription,
  renewSubscription,
  checkSubscriptionStatus,
  checkFeatureAccess,
  getSubscriptionSummary,
} from "../controllers/subscription.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  changePlanSchema,
  renewSubscriptionSchema,
} from "../validators/subscription.validator.js";

const router = Router();

router.use(requireAuth);

// Subscription
router.post(
  "/",
  validate(createSubscriptionSchema),
  createSubscription
);

router.get("/", getSubscription);

router.get("/summary", getSubscriptionSummary);

router.get("/status", checkSubscriptionStatus);

router.get("/feature-access", checkFeatureAccess);

router.patch(
  "/:id",
  validate(updateSubscriptionSchema),
  updateSubscription
);

router.patch(
  "/:id/change-plan",
  validate(changePlanSchema),
  changePlan
);

router.patch("/:id/cancel", cancelSubscription);

router.patch("/:id/resume", resumeSubscription);

router.patch(
  "/:id/renew",
  validate(renewSubscriptionSchema),
  renewSubscription
);

export default router;