import ApiError from "../../utils/ApiError.js";

import workspaceRepository from "./workspace.repository.js";
import toWorkspaceDto, { toWorkspaceListDto } from "./workspace.mapper.js";
import { WORKSPACE_PERMISSIONS } from "./workspace.permissions.js";
import emailService from "../../services/email.service.js";
import env from "../../config/env/index.js";

class WorkspaceService {
    async checkWorkspaceAccess(workspaceId, userId, roles = []) {
        const membership = await workspaceRepository.findMembership(workspaceId, userId);

        if (!membership) throw new ApiError(403, "You do not have access to this workspace.");
        if (roles.length && !roles.includes(membership.role)) {
            throw new ApiError(403, "You do not have permission to perform this action.");
        }

        return membership;
    }

    async getWorkspaceOrFail(workspaceId, options = {}) {
        const workspace = await workspaceRepository.findById(workspaceId, options);
        if (!workspace) throw new ApiError(404, "Workspace not found.");
        return workspace;
    }

    async createWorkspace(ownerId, payload) {
        const workspace = await workspaceRepository.create({ ...payload, owner: ownerId });

        await workspaceRepository.createMembership({
            workspace: workspace._id,
            user: ownerId,
            role: "owner",
            invitedBy: ownerId,
            status: "active",
            joinedAt: new Date(),
        });

        return toWorkspaceDto(workspace);
    }

    async getWorkspace(workspaceId, userId) {
        await this.checkWorkspaceAccess(workspaceId, userId, WORKSPACE_PERMISSIONS.VIEW);
        return toWorkspaceDto(await this.getWorkspaceOrFail(workspaceId, {
            populate: { path: "owner", select: "firstName lastName email avatar" },
        }));
    }

    async getUserWorkspaces(userId) {
        const memberships = await workspaceRepository.findUserWorkspaces(userId);
        return toWorkspaceListDto(memberships.map(({ workspace }) => workspace).filter(Boolean));
    }

    async updateWorkspace(workspaceId, userId, payload) {
        await this.checkWorkspaceAccess(workspaceId, userId, WORKSPACE_PERMISSIONS.UPDATE);
        return toWorkspaceDto(await workspaceRepository.updateById(workspaceId, payload));
    }

    async deleteWorkspace(workspaceId, userId) {
        await this.checkWorkspaceAccess(workspaceId, userId, WORKSPACE_PERMISSIONS.DELETE);
        await workspaceRepository.deleteMemberships(workspaceId);
        await workspaceRepository.deleteById(workspaceId);
    }

    async inviteMember(workspaceId, email, invitedBy, role = "member") {
        await this.checkWorkspaceAccess(workspaceId, invitedBy, WORKSPACE_PERMISSIONS.INVITE_MEMBER);
        const user = await workspaceRepository.findUserByEmail(email);

        if (!user) throw new ApiError(404, "User not found.");

        const existingMember = await workspaceRepository.findMembership(workspaceId, user._id, {
            activeOnly: false,
        });
        if (existingMember) throw new ApiError(400, "User is already a member of this workspace.");

        const membership = await workspaceRepository.createMembership({
            workspace: workspaceId,
            user: user._id,
            invitedBy,
            role,
            status: "invited",
        });

        const workspace = await this.getWorkspaceOrFail(workspaceId);
        const inviter = await workspaceRepository.findUserById(invitedBy);

        try {
            await emailService.sendWorkspaceInvite({
                email,
                workspace: workspace.name,
                inviter: inviter?.firstName ? `${inviter.firstName} ${inviter.lastName || ""}`.trim() : "A teammate",
                inviteLink: `${env.CLIENT_URL}/workspaces/${workspaceId}/invite`,
            });
        } catch (error) {
            console.error("Failed to send workspace invite email:", error.message);
        }

        return membership;
    }

    async acceptInvitation(workspaceId, userId) {
        const invitation = await workspaceRepository.findMembership(workspaceId, userId, {
            activeOnly: false,
        });
        if (!invitation || invitation.status !== "invited") {
            throw new ApiError(404, "Invitation not found.");
        }

        return workspaceRepository.updateMembership(workspaceId, userId, {
            status: "active",
            joinedAt: new Date(),
        });
    }

    async getPendingInvitations(userId) {
        return workspaceRepository.findPendingInvitations(userId);
    }

    async declineInvitation(workspaceId, userId) {
        const invitation = await workspaceRepository.findMembership(workspaceId, userId, {
            activeOnly: false,
        });
        if (!invitation || invitation.status !== "invited") {
            throw new ApiError(404, "Invitation not found.");
        }

        await workspaceRepository.deleteMembership(workspaceId, userId);
    }

    async removeMember(workspaceId, memberId, actingUserId) {
        await this.checkWorkspaceAccess(workspaceId, actingUserId, WORKSPACE_PERMISSIONS.REMOVE_MEMBER);
        const member = await workspaceRepository.findMembership(workspaceId, memberId, { activeOnly: false });

        if (!member) throw new ApiError(404, "Member not found.");
        if (member.role === "owner") throw new ApiError(400, "Workspace owner cannot be removed.");

        await workspaceRepository.deleteMembership(workspaceId, memberId);
    }

    async updateMemberRole(workspaceId, memberId, role, actingUserId) {
        await this.checkWorkspaceAccess(workspaceId, actingUserId, WORKSPACE_PERMISSIONS.UPDATE_MEMBER);
        const member = await workspaceRepository.updateMembership(workspaceId, memberId, { role });
        if (!member) throw new ApiError(404, "Member not found.");

        return member;
    }

    async getMembers(workspaceId, userId) {
        await this.checkWorkspaceAccess(workspaceId, userId, WORKSPACE_PERMISSIONS.VIEW);
        return workspaceRepository.findMembers(workspaceId);
    }

    async transferOwnership(workspaceId, newOwnerId, actingUserId) {
        await this.checkWorkspaceAccess(workspaceId, actingUserId, WORKSPACE_PERMISSIONS.TRANSFER_OWNERSHIP);
        await this.getWorkspaceOrFail(workspaceId);

        const newOwner = await workspaceRepository.findMembership(workspaceId, newOwnerId);
        if (!newOwner) throw new ApiError(404, "New owner must already be a workspace member.");

        await workspaceRepository.updateMembership(workspaceId, actingUserId, { role: "admin" });
        await workspaceRepository.updateMembership(workspaceId, newOwnerId, { role: "owner" });

        return toWorkspaceDto(await workspaceRepository.updateById(workspaceId, { owner: newOwnerId }));
    }
}

export default new WorkspaceService();
