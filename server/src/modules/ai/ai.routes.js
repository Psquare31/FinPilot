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
  generateResponse,
  // Gemini-backed features
  getAiStatus,
  chat,
  getInsights,
  getBudgetRecommendations,
  categorizeTransaction,
  getInvestmentAnalysis,
  getForecast,
  getReport,
  analyzeReceipt,
} from "./ai.controller.js";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.js";

import {
  createAIInteractionSchema,
  feedbackSchema,
} from "./ai.validation.js";

const router = Router();

router.use(requireAuth);

// ======================================================
// AI features (Gemini)
//
// Declared before the "/:id" routes below, otherwise Express would match
// paths like "/status" as an interaction id.
// ======================================================

router.get("/status", getAiStatus);

router.post("/chat", chat);

router.get("/insights", getInsights);

router.get("/budget-recommendations", getBudgetRecommendations);

router.post("/categorize", categorizeTransaction);

router.get("/investment-analysis", getInvestmentAnalysis);

router.get("/forecast", getForecast);

router.get("/report", getReport);

router.post("/receipt", analyzeReceipt);

router.post("/generate-response", generateResponse);

// ======================================================
// Interaction log
// ======================================================

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

export default router;
