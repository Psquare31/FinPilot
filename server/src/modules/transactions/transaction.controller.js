import transactionService from "./transaction.service.js";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// Create Transaction
export const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      transaction,
      "Transaction created successfully."
    )
  );
});

// Get Transactions
export const getTransactions = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const transactions = await transactionService.getTransactions(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      transactions,
      "Transactions fetched successfully."
    )
  );
});

// Get Transaction by ID
export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      transaction,
      "Transaction fetched successfully."
    )
  );
});

// Update Transaction
export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.updateTransaction(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      transaction,
      "Transaction updated successfully."
    )
  );
});

// Delete Transaction
export const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.deleteTransaction(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Transaction deleted successfully."
    )
  );
});