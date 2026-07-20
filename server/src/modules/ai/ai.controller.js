import aiInteractionService from "./ai.service.js";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// Every AI feature is workspace-scoped and attributed to the caller.
const scope = (req) => {
  const workspace = req.query.workspace || req.body?.workspace;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  return { workspace, user: req.user._id };
};

const ok = (res, data, message) =>
  res.status(200).json(new ApiResponse(200, data, message));

// AI availability — lets the client hide the feature when unconfigured.
export const getAiStatus = asyncHandler(async (req, res) =>
  ok(res, aiInteractionService.status(), "AI status fetched successfully.")
);

// Chat grounded in the workspace's real financial data
export const chat = asyncHandler(async (req, res) => {
  const { message, history, conversationId } = req.body;

  const result = await aiInteractionService.chat({
    ...scope(req),
    message,
    history,
    conversationId,
  });

  return ok(res, result, "AI response generated successfully.");
});

export const getInsights = asyncHandler(async (req, res) =>
  ok(
    res,
    await aiInteractionService.financialInsight(scope(req)),
    "Financial insights generated successfully."
  )
);

export const getBudgetRecommendations = asyncHandler(async (req, res) =>
  ok(
    res,
    await aiInteractionService.budgetRecommendation(scope(req)),
    "Budget recommendations generated successfully."
  )
);

export const categorizeTransaction = asyncHandler(async (req, res) => {
  const { description, amount, merchant } = req.body;

  return ok(
    res,
    await aiInteractionService.categorizeTransaction({
      ...scope(req),
      description,
      amount,
      merchant,
    }),
    "Transaction categorized successfully."
  );
});

export const getInvestmentAnalysis = asyncHandler(async (req, res) =>
  ok(
    res,
    await aiInteractionService.investmentAnalysis(scope(req)),
    "Investment analysis generated successfully."
  )
);

export const getForecast = asyncHandler(async (req, res) =>
  ok(
    res,
    await aiInteractionService.forecast(scope(req)),
    "Forecast generated successfully."
  )
);

export const getReport = asyncHandler(async (req, res) =>
  ok(
    res,
    await aiInteractionService.generateReport(scope(req)),
    "Report generated successfully."
  )
);

export const analyzeReceipt = asyncHandler(async (req, res) => {
  const { image, mimeType } = req.body;

  return ok(
    res,
    await aiInteractionService.analyzeReceipt({
      ...scope(req),
      image,
      mimeType,
    }),
    "Receipt analyzed successfully."
  );
});

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
  const { workspace } = scope(req);

  const rows = await aiInteractionService.getConversationHistory(
    req.params.conversationId,
    workspace
  );

  // Flatten each stored turn back into a chat transcript for the UI.
  const messages = rows.flatMap((row) => [
    { role: "user", content: row.prompt },
    { role: "assistant", content: row.response },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      messages,
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
  const response = await aiInteractionService.generateResponse({
    ...req.body,
    ...scope(req),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      response,
      "AI response generated successfully."
    )
  );
});