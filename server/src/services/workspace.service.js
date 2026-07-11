import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import User from "../models/User.js";

class WorkspaceService extends BaseService {
  constructor() {
    super(Workspace);
  }

  // Check workspace access
  async checkWorkspaceAccess(workspaceId, userId, roles = []) {
    const membership = await WorkspaceMember.findOne({
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

    if (roles.length && !roles.includes(membership.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action."
      );
    }

    return membership;
  }

  // Create workspace
  async createWorkspace(ownerId, payload) {
    const workspace = await this.create({
      ...payload,
      owner: ownerId,
    });

    await WorkspaceMember.create({
      workspace: workspace._id,
      user: ownerId,
      role: "owner",
      invitedBy: ownerId,
      status: "active",
      joinedAt: new Date(),
    });

    return workspace;
  }

  // Get workspace by id
  async getWorkspace(workspaceId, userId) {
    await this.checkWorkspaceAccess(workspaceId, userId);

    return this.findById(workspaceId, {
      populate: [
        {
          path: "owner",
          select: "firstName lastName email avatar",
        },
      ],
    });
  }

  // Get user workspaces
  async getUserWorkspaces(userId) {
    const memberships = await WorkspaceMember.find({
      user: userId,
      status: "active",
    }).populate("workspace");

    return memberships.map((membership) => membership.workspace);
  }

  // Update workspace
  async updateWorkspace(workspaceId, userId, payload) {
    await this.checkWorkspaceAccess(workspaceId, userId, [
      "owner",
      "admin",
    ]);

    return this.updateById(workspaceId, payload);
  }

  // Delete workspace
  async deleteWorkspace(workspaceId, userId) {
    await this.checkWorkspaceAccess(workspaceId, userId, [
      "owner",
    ]);

    await WorkspaceMember.deleteMany({
      workspace: workspaceId,
    });

    return this.deleteById(workspaceId);
  }

  // Invite member
  async inviteMember(workspaceId, email, invitedBy) {
    await this.checkWorkspaceAccess(workspaceId, invitedBy, [
      "owner",
      "admin",
    ]);

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const existingMember = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: user._id,
    });

    if (existingMember) {
      throw new ApiError(
        400,
        "User is already a member of this workspace."
      );
    }

    return WorkspaceMember.create({
      workspace: workspaceId,
      user: user._id,
      invitedBy,
      role: "member",
      status: "pending",
    });
  }

  // Accept invitation
  async acceptInvitation(workspaceId, userId) {
    const membership = await WorkspaceMember.findOneAndUpdate(
      {
        workspace: workspaceId,
        user: userId,
      },
      {
        status: "active",
        joinedAt: new Date(),
      },
      {
        new: true,
      }
    );

    if (!membership) {
      throw new ApiError(404, "Invitation not found.");
    }

    return membership;
  }

  // Remove member
  async removeMember(
    workspaceId,
    memberId,
    actingUserId
  ) {
    await this.checkWorkspaceAccess(
      workspaceId,
      actingUserId,
      ["owner", "admin"]
    );

    const member = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: memberId,
    });

    if (!member) {
      throw new ApiError(404, "Member not found.");
    }

    if (member.role === "owner") {
      throw new ApiError(
        400,
        "Workspace owner cannot be removed."
      );
    }

    await member.deleteOne();

    return member;
  }

  // Update member role
  async updateMemberRole(
    workspaceId,
    memberId,
    role,
    actingUserId
  ) {
    await this.checkWorkspaceAccess(
      workspaceId,
      actingUserId,
      ["owner"]
    );

    const member =
      await WorkspaceMember.findOneAndUpdate(
        {
          workspace: workspaceId,
          user: memberId,
        },
        {
          role,
        },
        {
          new: true,
        }
      );

    if (!member) {
      throw new ApiError(404, "Member not found.");
    }

    return member;
  }

  // Get workspace members
  async getMembers(workspaceId, userId) {
    await this.checkWorkspaceAccess(
      workspaceId,
      userId
    );

    return WorkspaceMember.find({
      workspace: workspaceId,
      status: "active",
    })
      .populate(
        "user",
        "firstName lastName email avatar"
      )
      .lean();
  }

  // Transfer ownership
  async transferOwnership(
    workspaceId,
    newOwnerId,
    actingUserId
  ) {
    await this.checkWorkspaceAccess(
      workspaceId,
      actingUserId,
      ["owner"]
    );

    const workspace = await Workspace.findById(
      workspaceId
    );

    if (!workspace) {
      throw new ApiError(
        404,
        "Workspace not found."
      );
    }

    const newOwner =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: newOwnerId,
        status: "active",
      });

    if (!newOwner) {
      throw new ApiError(
        404,
        "New owner must already be a workspace member."
      );
    }

    await WorkspaceMember.findOneAndUpdate(
      {
        workspace: workspaceId,
        user: actingUserId,
      },
      {
        role: "admin",
      }
    );

    await WorkspaceMember.findOneAndUpdate(
      {
        workspace: workspaceId,
        user: newOwnerId,
      },
      {
        role: "owner",
      }
    );

    workspace.owner = newOwnerId;

    await workspace.save();

    return workspace;
  }
}

export default new WorkspaceService();