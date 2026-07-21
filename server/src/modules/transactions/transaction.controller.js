import transactionService from "./transaction.service.js";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// The workspace a read endpoint should operate on.
const requireWorkspace = (req) => {
  const workspace = req.query.workspace;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  return workspace;
};

// Zod strips unknown keys, so the validated body is the safe one to persist —
// the raw body still carries anything the caller sent (workspace, audit,
// isDeleted), which would otherwise be mass-assigned onto the document.
const validBody = (req) => req.validatedData?.body ?? req.body;

// Create Transaction
export const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(
    req.user._id,
    validBody(req)
  );

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
  const transactions = await transactionService.getTransactions(
    requireWorkspace(req),
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
    req.user._id,
    validBody(req)
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
  await transactionService.deleteTransaction(
    req.params.id,
    req.user._id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Transaction deleted successfully."
    )
  );
});

// Transfer Between Accounts
export const transferBetweenAccounts = asyncHandler(async (req, res) => {
  const transaction = await transactionService.transferBetweenAccounts(
    req.user._id,
    validBody(req)
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      transaction,
      "Transfer completed successfully."
    )
  );
});

// Duplicate Transaction
export const duplicateTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.duplicateTransaction(
    req.params.id,
    req.user._id
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      transaction,
      "Transaction duplicated successfully."
    )
  );
});

// Bulk Create Transactions
export const bulkCreateTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionService.bulkCreateTransactions(
    req.user._id,
    validBody(req).transactions
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      transactions,
      "Transactions created successfully."
    )
  );
});

// Bulk Delete Transactions
export const bulkDeleteTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.bulkDeleteTransactions(
    req.user._id,
    validBody(req).transactionIds
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Transactions deleted successfully."
    )
  );
});

// Get Transaction Statistics
export const getTransactionStatistics = asyncHandler(async (req, res) => {
  const statistics = await transactionService.getTransactionStatistics(
    requireWorkspace(req)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      statistics,
      "Transaction statistics fetched successfully."
    )
  );
});

// Get Monthly Summary
export const getMonthlySummary = asyncHandler(async (req, res) => {
  const now = new Date();

  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;

  const summary = await transactionService.getMonthlySummary(
    requireWorkspace(req),
    year,
    month
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Monthly summary fetched successfully."
    )
  );
});

// Get Cash Flow
export const getCashFlow = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Start date and end date are required.");
  }

  const cashFlow = await transactionService.getCashFlow(
    requireWorkspace(req),
    startDate,
    endDate
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      cashFlow,
      "Cash flow fetched successfully."
    )
  );
});

// Get Income vs Expense
export const getIncomeVsExpense = asyncHandler(async (req, res) => {
  const result = await transactionService.getIncomeVsExpense(
    requireWorkspace(req)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Income vs expense fetched successfully."
    )
  );
});

// Get Spending by Category
export const getSpendingByCategory = asyncHandler(async (req, res) => {
  const result = await transactionService.getSpendingByCategory(
    requireWorkspace(req)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Spending by category fetched successfully."
    )
  );
});

// Get Spending by Account
export const getSpendingByAccount = asyncHandler(async (req, res) => {
  const result = await transactionService.getSpendingByAccount(
    requireWorkspace(req)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Spending by account fetched successfully."
    )
  );
});

// Get Recent Transactions
export const getRecentTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getRecentTransactions(
    requireWorkspace(req),
    Number(req.query.limit) || 10
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Recent transactions fetched successfully."
    )
  );
});
