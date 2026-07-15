import workspaceService from "./workspace.service.js";

import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// Create Workspace
const createWorkspace = asyncHandler(async (req, res) => {
    const workspace = await workspaceService.createWorkspace(
        req.user._id,
        req.validatedData?.body ?? req.body
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
const getUserWorkspaces = asyncHandler(async (req, res) => {
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

// Get Workspace By Id
const getWorkspaceById = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const workspace = await workspaceService.getWorkspace(
        workspaceId,
        req.user._id
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
const updateWorkspace = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const workspace = await workspaceService.updateWorkspace(
        workspaceId,
        req.user._id,
        req.validatedData?.body ?? req.body
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
const deleteWorkspace = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    await workspaceService.deleteWorkspace(
        workspaceId,
        req.user._id
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Workspace deleted successfully."
        )
    );
});

// Invite Member
const inviteMember = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const { email } = req.validatedData?.body ?? req.body;

    const member = await workspaceService.inviteMember(
        workspaceId,
        email,
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
const acceptInvitation = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const workspace =
        await workspaceService.acceptInvitation(
            workspaceId,
            req.user._id
        );

    return res.status(200).json(
        new ApiResponse(
            200,
            workspace,
            "Invitation accepted successfully."
        )
    );
});

// Remove Member
const removeMember = asyncHandler(async (req, res) => {
    const { workspaceId, memberId } = req.params;

    await workspaceService.removeMember(
        workspaceId,
        memberId,
        req.user._id
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
const updateMemberRole = asyncHandler(async (req, res) => {
    const { workspaceId, memberId } = req.params;

    const { role } = req.validatedData?.body ?? req.body;

    const member =
        await workspaceService.updateMemberRole(
            workspaceId,
            memberId,
            role,
            req.user._id
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
const getMembers = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const members = await workspaceService.getMembers(
        workspaceId,
        req.user._id
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
const transferOwnership = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const { newOwnerId } =
        req.validatedData?.body ?? req.body;

    const workspace =
        await workspaceService.transferOwnership(
            workspaceId,
            newOwnerId,
            req.user._id
        );

    return res.status(200).json(
        new ApiResponse(
            200,
            workspace,
            "Workspace ownership transferred successfully."
        )
    );
});

export default {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    acceptInvitation,
    removeMember,
    updateMemberRole,
    getMembers,
    transferOwnership,
};