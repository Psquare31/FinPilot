import goalService from "../services/goal.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Goal
export const createGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.createGoal(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      goal,
      "Goal created successfully."
    )
  );
});

// Get Goals
export const getGoals = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const goals = await goalService.getGoals(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      goals,
      "Goals fetched successfully."
    )
  );
});

// Get Goal by ID
export const getGoalById = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoalById(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      goal,
      "Goal fetched successfully."
    )
  );
});

// Update Goal
export const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoal(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      goal,
      "Goal updated successfully."
    )
  );
});

// Archive Goal
export const archiveGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.archiveGoal(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      goal,
      "Goal archived successfully."
    )
  );
});

// Restore Goal
export const restoreGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.restoreGoal(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      goal,
      "Goal restored successfully."
    )
  );
});

// Delete Goal
export const deleteGoal = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Goal deleted successfully."
    )
  );
});

// Add Contribution
export const addContribution = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    throw new ApiError(
      400,
      "A valid contribution amount is required."
    );
  }

  const goal = await goalService.addContribution(
    req.params.id,
    amount
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      goal,
      "Contribution added successfully."
    )
  );
});

// Withdraw Contribution
export const withdrawContribution = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    throw new ApiError(
      400,
      "A valid withdrawal amount is required."
    );
  }

  const goal = await goalService.withdrawContribution(
    req.params.id,
    amount
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      goal,
      "Contribution withdrawn successfully."
    )
  );
});

// Get Goal Progress
export const getGoalProgress = asyncHandler(async (req, res) => {
  const progress = await goalService.getGoalProgress(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      progress,
      "Goal progress fetched successfully."
    )
  );
});

// Get Goal Summary
export const getGoalSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary = await goalService.getGoalSummary(
    workspace
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Goal summary fetched successfully."
    )
  );
});