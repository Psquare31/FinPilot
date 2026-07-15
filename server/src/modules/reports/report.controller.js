import reportService from "./report.service.js";

import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// Create Report
export const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      report,
      "Report created successfully."
    )
  );
});

// Get Reports
export const getReports = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const reports = await reportService.getReports(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      reports,
      "Reports fetched successfully."
    )
  );
});

// Get Report by ID
export const getReportById = asyncHandler(async (req, res) => {
  const report = await reportService.getReportById(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      report,
      "Report fetched successfully."
    )
  );
});

// Delete Report
export const deleteReport = asyncHandler(async (req, res) => {
  await reportService.deleteReport(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Report deleted successfully."
    )
  );
});

// Generate Monthly Report
export const generateMonthlyReport = asyncHandler(async (req, res) => {
  const { workspace, year, month } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const report = await reportService.generateMonthlyReport(
    workspace,
    Number(year),
    Number(month)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      report,
      "Monthly report generated successfully."
    )
  );
});

// Generate Net Worth Report
export const generateNetWorthReport = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const report = await reportService.generateNetWorthReport(
    workspace
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      report,
      "Net worth report generated successfully."
    )
  );
});

// Generate Cash Flow Report
export const generateCashFlowReport = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const report = await reportService.generateCashFlowReport(
    workspace
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      report,
      "Cash flow report generated successfully."
    )
  );
});

// Generate Investment Report
export const generateInvestmentReport = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const report = await reportService.generateInvestmentReport(
    workspace
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      report,
      "Investment report generated successfully."
    )
  );
});