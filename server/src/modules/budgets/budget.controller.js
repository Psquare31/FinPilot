import budgetService from "./budget.service.js";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// Create Budget
export const createBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.createBudget(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      budget,
      "Budget created successfully."
    )
  );
});

// Get Budgets
export const getBudgets = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const budgets = await budgetService.getBudgets(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      budgets,
      "Budgets fetched successfully."
    )
  );
});

// Get Budget by ID
export const getBudgetById = asyncHandler(async (req, res) => {
  const budget = await budgetService.getBudgetById(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      budget,
      "Budget fetched successfully."
    )
  );
});

// Update Budget
export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.updateBudget(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      budget,
      "Budget updated successfully."
    )
  );
});

// Archive Budget
export const archiveBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.archiveBudget(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      budget,
      "Budget archived successfully."
    )
  );
});

// Restore Budget
export const restoreBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.restoreBudget(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      budget,
      "Budget restored successfully."
    )
  );
});

// Delete Budget
export const deleteBudget = asyncHandler(async (req, res) => {
  await budgetService.deleteBudget(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Budget deleted successfully."
    )
  );
});

// Get Budget Progress
export const getBudgetProgress = asyncHandler(async (req, res) => {
  const progress = await budgetService.getBudgetProgress(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      progress,
      "Budget progress fetched successfully."
    )
  );
});

// Get Budget Overview
export const getBudgetOverview = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const overview = await budgetService.getBudgetOverview(
    workspace
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      overview,
      "Budget overview fetched successfully."
    )
  );
});