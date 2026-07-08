import workspaceService from "../services/workspace.service.js";

import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Workspace
export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace(
    req.user._id,
    req.body
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      workspace,
      "Workspace created successfully."
    )
  );
});

// Get User Workspaces
export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getUserWorkspaces(
    req.user._id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      workspaces,
      "Workspaces fetched successfully."
    )
  );
});

// Get Workspace by ID
export const getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getWorkspace(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      workspace,
      "Workspace fetched successfully."
    )
  );
});

// Update Workspace
export const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      workspace,
      "Workspace updated successfully."
    )
  );
});

// Delete Workspace
export const deleteWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.deleteWorkspace(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Workspace deleted successfully."
    )
  );
});

// Invite Member
export const inviteMember = asyncHandler(async (req, res) => {
  const member = await workspaceService.inviteMember(
    req.params.id,
    req.body.email,
    req.user._id
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      member,
      "Member invited successfully."
    )
  );
});

// Accept Invitation
export const acceptInvitation = asyncHandler(async (req, res) => {
  const member = await workspaceService.acceptInvitation(
    req.params.id,
    req.user._id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      member,
      "Invitation accepted successfully."
    )
  );
});

// Remove Member
export const removeMember = asyncHandler(async (req, res) => {
  await workspaceService.removeMember(
    req.params.id,
    req.params.memberId
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Member removed successfully."
    )
  );
});

// Update Member Role
export const updateMemberRole = asyncHandler(async (req, res) => {
  const member = await workspaceService.updateMemberRole(
    req.params.id,
    req.params.memberId,
    req.body.role
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      member,
      "Member role updated successfully."
    )
  );
});

// Get Workspace Members
export const getMembers = asyncHandler(async (req, res) => {
  const members = await workspaceService.getMembers(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      members,
      "Workspace members fetched successfully."
    )
  );
});

// Transfer Workspace Ownership
export const transferOwnership = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.transferOwnership(
    req.params.id,
    req.body.newOwnerId
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      workspace,
      "Workspace ownership transferred successfully."
    )
  );
});