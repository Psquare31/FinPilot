import accountService from "../services/account.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Account
export const createAccount = asyncHandler(async (req, res) => {
  const account = await accountService.createAccount(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      account,
      "Account created successfully."
    )
  );
});

// Get Accounts
export const getAccounts = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const accounts = await accountService.getAccounts(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      accounts,
      "Accounts fetched successfully."
    )
  );
});

// Get Account by ID
export const getAccountById = asyncHandler(async (req, res) => {
  const account = await accountService.getAccountById(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      account,
      "Account fetched successfully."
    )
  );
});

// Update Account
export const updateAccount = asyncHandler(async (req, res) => {
  const account = await accountService.updateAccount(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      account,
      "Account updated successfully."
    )
  );
});

// Archive Account
export const archiveAccount = asyncHandler(async (req, res) => {
  const account = await accountService.archiveAccount(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      account,
      "Account archived successfully."
    )
  );
});

// Restore Account
export const restoreAccount = asyncHandler(async (req, res) => {
  const account = await accountService.restoreAccount(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      account,
      "Account restored successfully."
    )
  );
});

// Delete Account
export const deleteAccount = asyncHandler(async (req, res) => {
  await accountService.permanentlyDeleteAccount(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Account deleted successfully."
    )
  );
});

// Get Total Balance
export const getTotalBalance = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary = await accountService.getTotalBalance(
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

// Adjust Account Balance
export const adjustBalance = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (typeof amount !== "number") {
    throw new ApiError(400, "Amount must be a number.");
  }

  const account = await accountService.adjustBalance(
    req.params.id,
    amount
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      account,
      "Account balance updated successfully."
    )
  );
});