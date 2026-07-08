import auditLogService from "../services/audit.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get Audit Logs
export const getLogs = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const logs = await auditLogService.getLogs(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      logs,
      "Audit logs fetched successfully."
    )
  );
});

// Get Audit Log by ID
export const getLogById = asyncHandler(async (req, res) => {
  const log = await auditLogService.getLogById(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      log,
      "Audit log fetched successfully."
    )
  );
});

// Delete Audit Log
export const deleteLog = asyncHandler(async (req, res) => {
  await auditLogService.deleteLog(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Audit log deleted successfully."
    )
  );
});

// Delete Old Audit Logs
export const deleteOldLogs = asyncHandler(async (req, res) => {
  const { beforeDate } = req.body;

  if (!beforeDate) {
    throw new ApiError(
      400,
      "Before date is required."
    );
  }

  const result =
    await auditLogService.deleteOldLogs(
      new Date(beforeDate)
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Old audit logs deleted successfully."
    )
  );
});

// Get Activity Summary
export const getActivitySummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await auditLogService.getActivitySummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Activity summary fetched successfully."
    )
  );
});

// Get User Activity
export const getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 20 } = req.query;

  const activity =
    await auditLogService.getUserActivity(
      userId,
      Number(limit)
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      activity,
      "User activity fetched successfully."
    )
  );
});

// Get Resource Activity
export const getResourceActivity = asyncHandler(async (req, res) => {
  const { resource, resourceId } = req.params;

  const activity =
    await auditLogService.getResourceActivity(
      resource,
      resourceId
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      activity,
      "Resource activity fetched successfully."
    )
  );
});