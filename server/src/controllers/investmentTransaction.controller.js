import investmentTransactionService from "../services/investmentTransaction.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get Investment Transactions
export const getInvestmentTransactions = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const transactions =
    await investmentTransactionService.getInvestmentTransactions(
      workspace,
      req.query
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      transactions,
      "Investment transactions fetched successfully."
    )
  );
});

// Get Investment Transaction by ID
export const getInvestmentTransactionById = asyncHandler(
  async (req, res) => {
    const transaction =
      await investmentTransactionService.getInvestmentTransactionById(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        transaction,
        "Investment transaction fetched successfully."
      )
    );
  }
);

// Delete Investment Transaction
export const deleteInvestmentTransaction = asyncHandler(
  async (req, res) => {
    await investmentTransactionService.deleteInvestmentTransaction(
      req.params.id
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Investment transaction deleted successfully."
      )
    );
  }
);

// Get Investment History
export const getInvestmentHistory = asyncHandler(async (req, res) => {
  const history =
    await investmentTransactionService.getInvestmentHistory(
      req.params.investmentId
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      history,
      "Investment history fetched successfully."
    )
  );
});

// Get Recent Investment Transactions
export const getRecentTransactions = asyncHandler(async (req, res) => {
  const { workspace, limit = 10 } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const transactions =
    await investmentTransactionService.getRecentTransactions(
      workspace,
      Number(limit)
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      transactions,
      "Recent investment transactions fetched successfully."
    )
  );
});

// Get Investment Activity Summary
export const getActivitySummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await investmentTransactionService.getActivitySummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Investment activity summary fetched successfully."
    )
  );
});