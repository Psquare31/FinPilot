import { Router } from "express";

import {
  createInteraction,
  getInteractions,
  getInteractionById,
  deleteInteraction,
  getConversationHistory,
  getUsageSummary,
  getFeatureUsage,
  recordFeedback,
  getAvailableModels,
  generateAIResponse,
} from "../controllers/aiInteraction.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createAIInteractionSchema,
  feedbackSchema,
} from "../validators/aiInteraction.validator.js";

const router = Router();

router.use(requireAuth);

// AI Interactions
router.post(
  "/",
  validate(createAIInteractionSchema),
  createInteraction
);

router.get("/", getInteractions);

router.get("/usage", getUsageSummary);

router.get("/feature-usage", getFeatureUsage);

router.get("/models", getAvailableModels);

router.get(
  "/conversation/:conversationId",
  getConversationHistory
);

router.get("/:id", getInteractionById);

router.patch(
  "/:id/feedback",
  validate(feedbackSchema),
  recordFeedback
);

router.delete("/:id", deleteInteraction);

router.post("/generate-response", generateAIResponse);

export default router;