import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";

import ApiError from "../utils/ApiError.js";

import {
    WORKSPACE_ROLES,
    OWNER_ROLES,
    ADMIN_ROLES,
    MEMBER_ROLES,
} from "../constants/roles.js";


class PermissionService {
    // ======================================================
    // Get workspace.
    // ======================================================

    async getWorkspace(workspaceId) {
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            throw new ApiError(
                404,
                "Workspace not found."
            );
        }

        return workspace;
    }

    // ======================================================
    // Get membership.
    // ======================================================

    async getMembership(
        workspaceId,
        userId
    ) {
        await this.getWorkspace(workspaceId);

        const membership =
            await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: userId,
                status: "active",
            });

        if (!membership) {
            throw new ApiError(
                403,
                "You do not have access to this workspace."
            );
        }

        return membership;
    }

    // ======================================================
    // Require workspace access.
    // ======================================================

    async requireWorkspaceAccess(
        workspaceId,
        userId
    ) {
        return this.getMembership(
            workspaceId,
            userId
        );
    }

    // ======================================================
    // Require workspace role.
    // ======================================================

    async requireWorkspaceRole(
        workspaceId,
        userId,
        roles
    ) {
        const membership =
            await this.getMembership(
                workspaceId,
                userId
            );

        if (
            !roles.includes(membership.role)
        ) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action."
            );
        }

        return membership;
    }

    // ======================================================
    // Require owner.
    // ======================================================

    async requireOwner(
        workspaceId,
        userId
    ) {
        return this.requireWorkspaceRole(
            workspaceId,
            userId,
            OWNER_ROLES
        );
    }

    // ======================================================
    // Require admin.
    // ======================================================

    async requireAdmin(
        workspaceId,
        userId
    ) {
        return this.requireWorkspaceRole(
            workspaceId,
            userId,
            ADMIN_ROLES
        );
    }

    // ======================================================
    // Require member.
    // ======================================================

    async requireMember(
        workspaceId,
        userId
    ) {
        return this.requireWorkspaceRole(
            workspaceId,
            userId,
            MEMBER_ROLES
        );
    }

    // ======================================================
    // Check owner.
    // ======================================================

    async isOwner(
        workspaceId,
        userId
    ) {
        const membership =
            await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: userId,
                status: "active",
            });

        return (
            membership?.role ===
            WORKSPACE_ROLES.OWNER
        );
    }

    // ======================================================
    // Check admin.
    // ======================================================

    async isAdmin(
        workspaceId,
        userId
    ) {
        const membership =
            await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: userId,
                status: "active",
            });

        return ADMIN_ROLES.includes(
            membership?.role
        );
    }

    // ======================================================
    // Check member.
    // ======================================================

    async isMember(
        workspaceId,
        userId
    ) {
        return Boolean(
            await WorkspaceMember.exists({
                workspace: workspaceId,
                user: userId,
                status: "active",
            })
        );
    }

    // ======================================================
    // Get workspace members.
    // ======================================================

    async getWorkspaceMembers(
        workspaceId
    ) {
        return WorkspaceMember.find({
            workspace: workspaceId,
            status: "active",
        });
    }

    // ======================================================
    // Count workspace members.
    // ======================================================

    async countMembers(
        workspaceId
    ) {
        return WorkspaceMember.countDocuments({
            workspace: workspaceId,
            status: "active",
        });
    }
}

export default new PermissionService();