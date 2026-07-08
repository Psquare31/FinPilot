import investmentService from "../services/investment.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Investment
export const createInvestment = asyncHandler(async (req, res) => {
  const investment = await investmentService.createInvestment(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      investment,
      "Investment created successfully."
    )
  );
});

// Get Investments
export const getInvestments = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const investments = await investmentService.getInvestments(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      investments,
      "Investments fetched successfully."
    )
  );
});

// Get Investment by ID
export const getInvestmentById = asyncHandler(async (req, res) => {
  const investment = await investmentService.getInvestmentById(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      investment,
      "Investment fetched successfully."
    )
  );
});

// Update Investment
export const updateInvestment = asyncHandler(async (req, res) => {
  const investment = await investmentService.updateInvestment(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      investment,
      "Investment updated successfully."
    )
  );
});

// Archive Investment
export const archiveInvestment = asyncHandler(async (req, res) => {
  const investment = await investmentService.archiveInvestment(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      investment,
      "Investment archived successfully."
    )
  );
});

// Restore Investment
export const restoreInvestment = asyncHandler(async (req, res) => {
  const investment = await investmentService.restoreInvestment(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      investment,
      "Investment restored successfully."
    )
  );
});

// Delete Investment
export const deleteInvestment = asyncHandler(async (req, res) => {
  await investmentService.deleteInvestment(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Investment deleted successfully."
    )
  );
});

// Buy Investment
export const buyInvestment = asyncHandler(async (req, res) => {
  const investment = await investmentService.buyInvestment(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      investment,
      "Investment purchased successfully."
    )
  );
});

// Sell Investment
export const sellInvestment = asyncHandler(async (req, res) => {
  const investment = await investmentService.sellInvestment(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      investment,
      "Investment sold successfully."
    )
  );
});

// Update Current Price
export const updateCurrentPrice = asyncHandler(async (req, res) => {
  const { currentPrice } = req.body;

  if (typeof currentPrice !== "number" || currentPrice < 0) {
    throw new ApiError(
      400,
      "A valid current price is required."
    );
  }

  const investment = await investmentService.updateCurrentPrice(
    req.params.id,
    currentPrice
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      investment,
      "Current price updated successfully."
    )
  );
});

// Get Investment Summary
export const getInvestmentSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary = await investmentService.getInvestmentSummary(
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

// Get Portfolio Allocation
export const getPortfolioAllocation = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const allocation =
    await investmentService.getPortfolioAllocation(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      allocation,
      "Portfolio allocation fetched successfully."
    )
  );
});