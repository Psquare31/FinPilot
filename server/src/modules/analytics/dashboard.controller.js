import dashboardService from "./dashboard.service.js";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// Get Dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const dashboard = await dashboardService.getDashboard(
    workspace
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      dashboard,
      "Dashboard fetched successfully."
    )
  );
});

// Get Account Summary
export const getAccountSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await dashboardService.getAccountSummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Account summary fetched successfully."
    )
  );
});

// Get Transaction Summary
export const getTransactionSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await dashboardService.getTransactionSummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Transaction summary fetched successfully."
    )
  );
});

// Get Budget Summary
export const getBudgetSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await dashboardService.getBudgetSummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Budget summary fetched successfully."
    )
  );
});

// Get Goal Summary
export const getGoalSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await dashboardService.getGoalSummary(
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

// Get Debt Summary
export const getDebtSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await dashboardService.getDebtSummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Debt summary fetched successfully."
    )
  );
});

// Get Investment Summary
export const getInvestmentSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await dashboardService.getInvestmentSummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Investment summary fetched successfully."
    )
  );
});

// Get Recent Transactions
export const getRecentTransactions = asyncHandler(async (req, res) => {
  const { workspace, limit = 10 } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const transactions =
    await dashboardService.getRecentTransactions(
      workspace,
      Number(limit)
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      transactions,
      "Recent transactions fetched successfully."
    )
  );
});