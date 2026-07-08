import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import User from "../models/User.js";

class WorkspaceService extends BaseService {
  constructor() {
    super(Workspace);
  }

  // Create Workspace
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
      joinedAt: new Date(),
    });

    return workspace;
  }

  // Get Workspace by ID
  async getWorkspace(id) {
    return this.findById(id, {
      populate: [
        {
          path: "owner",
          select: "firstName lastName email imageUrl",
        },
      ],
    });
  }

  // Get User Workspaces
  async getUserWorkspaces(userId) {
    const memberships = await WorkspaceMember.find({
      user: userId,
      status: "active",
    }).populate("workspace");

    return memberships.map((member) => member.workspace);
  }

  // Update Workspace
  async updateWorkspace(id, payload) {
    return this.updateById(id, payload);
  }

  // Delete Workspace
  async deleteWorkspace(id) {
    await WorkspaceMember.deleteMany({
      workspace: id,
    });

    return this.deleteById(id);
  }

  // Invite Member to Workspace
  async inviteMember(workspaceId, email, invitedBy) {
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

  // Accept Invitation
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

  // Remove Member from Workspace
  async removeMember(workspaceId, memberId) {
    const member = await WorkspaceMember.findOneAndDelete({
      workspace: workspaceId,
      user: memberId,
    });

    if (!member) {
      throw new ApiError(404, "Member not found.");
    }

    return member;
  }

  // Update Member Role
  async updateMemberRole(workspaceId, memberId, role) {
    const member = await WorkspaceMember.findOneAndUpdate(
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

  // Get Workspace Members
  async getMembers(workspaceId) {
    return WorkspaceMember.find({
      workspace: workspaceId,
      status: "active",
    })
      .populate("user", "firstName lastName email imageUrl")
      .lean();
  }
  
  // Transfer Workspace Ownership
  async transferOwnership(workspaceId, newOwnerId) {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw new ApiError(404, "Workspace not found.");
    }

    workspace.owner = newOwnerId;

    await workspace.save();

    await WorkspaceMember.findOneAndUpdate(
      {
        workspace: workspaceId,
        user: newOwnerId,
      },
      {
        role: "owner",
      }
    );

    return workspace;
  }
}

export default new WorkspaceService();