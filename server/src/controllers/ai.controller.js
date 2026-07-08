import aiInteractionService from "../services/ai.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create AI Interaction
export const createInteraction = asyncHandler(async (req, res) => {
  const interaction =
    await aiInteractionService.createInteraction(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      interaction,
      "AI interaction created successfully."
    )
  );
});

// Get AI Interactions
export const getInteractions = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const interactions =
    await aiInteractionService.getInteractions(
      workspace,
      req.query
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      interactions,
      "AI interactions fetched successfully."
    )
  );
});

// Get AI Interaction by ID
export const getInteractionById = asyncHandler(async (req, res) => {
  const interaction =
    await aiInteractionService.getInteractionById(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      interaction,
      "AI interaction fetched successfully."
    )
  );
});

// Delete AI Interaction
export const deleteInteraction = asyncHandler(async (req, res) => {
  await aiInteractionService.deleteInteraction(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "AI interaction deleted successfully."
    )
  );
});

// Get Conversation History
export const getConversationHistory = asyncHandler(async (req, res) => {
  const history =
    await aiInteractionService.getConversationHistory(
      req.params.conversationId
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      history,
      "Conversation history fetched successfully."
    )
  );
});

// Get AI Usage Summary
export const getUsageSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await aiInteractionService.getUsageSummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "AI usage summary fetched successfully."
    )
  );
});

// Get Feature Usage
export const getFeatureUsage = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const usage =
    await aiInteractionService.getFeatureUsage(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      usage,
      "AI feature usage fetched successfully."
    )
  );
});

// Record User Feedback
export const recordFeedback = asyncHandler(async (req, res) => {
  const { feedback } = req.body;

  if (!feedback) {
    throw new ApiError(400, "Feedback is required.");
  }

  const interaction =
    await aiInteractionService.recordFeedback(
      req.params.id,
      feedback
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      interaction,
      "Feedback recorded successfully."
    )
  );
});

// Get Available Models
export const getAvailableModels = asyncHandler(async (req, res) => {
  const models =
    await aiInteractionService.getAvailableModels();

  return res.status(200).json(
    new ApiResponse(
      200,
      models,
      "Available AI models fetched successfully."
    )
  );
});

// Generate AI Response
export const generateResponse = asyncHandler(async (req, res) => {
  const response =
    await aiInteractionService.generateResponse(req.body);

  return res.status(200).json(
    new ApiResponse(
      200,
      response,
      "AI response generated successfully."
    )
  );
});