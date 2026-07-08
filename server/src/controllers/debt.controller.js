import debtService from "../services/debt.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Debt
export const createDebt = asyncHandler(async (req, res) => {
  const debt = await debtService.createDebt(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      debt,
      "Debt created successfully."
    )
  );
});

// Get Debts
export const getDebts = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const debts = await debtService.getDebts(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      debts,
      "Debts fetched successfully."
    )
  );
});

// Get Debt by ID
export const getDebtById = asyncHandler(async (req, res) => {
  const debt = await debtService.getDebtById(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      debt,
      "Debt fetched successfully."
    )
  );
});

// Update Debt
export const updateDebt = asyncHandler(async (req, res) => {
  const debt = await debtService.updateDebt(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      debt,
      "Debt updated successfully."
    )
  );
});

// Archive Debt
export const archiveDebt = asyncHandler(async (req, res) => {
  const debt = await debtService.archiveDebt(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      debt,
      "Debt archived successfully."
    )
  );
});

// Restore Debt
export const restoreDebt = asyncHandler(async (req, res) => {
  const debt = await debtService.restoreDebt(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      debt,
      "Debt restored successfully."
    )
  );
});

// Delete Debt
export const deleteDebt = asyncHandler(async (req, res) => {
  await debtService.deleteDebt(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Debt deleted successfully."
    )
  );
});

// Record Payment
export const recordPayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    throw new ApiError(
      400,
      "A valid payment amount is required."
    );
  }

  const debt = await debtService.recordPayment(
    req.params.id,
    amount
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      debt,
      "Payment recorded successfully."
    )
  );
});

// Get Debt Progress
export const getDebtProgress = asyncHandler(async (req, res) => {
  const progress = await debtService.getDebtProgress(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      progress,
      "Debt progress fetched successfully."
    )
  );
});

// Get Debt Summary
export const getDebtSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary = await debtService.getDebtSummary(
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

// Get Upcoming Payments
export const getUpcomingPayments = asyncHandler(async (req, res) => {
  const { workspace, days = 30 } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const payments = await debtService.getUpcomingPayments(
    workspace,
    Number(days)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      payments,
      "Upcoming payments fetched successfully."
    )
  );
});