import Workspace from "../../models/Workspace.js";
import WorkspaceMember from "../../models/WorkspaceMember.js";
import User from "../../models/User.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class WorkspaceRepository extends BaseRepository {
    constructor() { super(Workspace); }

    findMembership(workspaceId, userId, options = {}) {
        const query = WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
        if (options.activeOnly !== false) query.where({ status: "active" });
        if (options.lean !== false) query.lean();
        return query;
    }

    createMembership(payload) { return WorkspaceMember.create(payload); }

    findUserByEmail(email) { return User.findOne({ email }).lean(); }

    findUserById(userId) { return User.findById(userId).lean(); }

    findUserWorkspaces(userId) {
        return WorkspaceMember.find({ user: userId, status: "active" })
            .populate("workspace")
            .lean();
    }

    findPendingInvitations(userId) {
        return WorkspaceMember.find({ user: userId, status: "invited" })
            .populate("workspace", "name type color icon")
            .populate("invitedBy", "firstName lastName email")
            .lean();
    }

    deleteMemberships(workspaceId) { return WorkspaceMember.deleteMany({ workspace: workspaceId }); }

    updateMembership(workspaceId, userId, payload) {
        return WorkspaceMember.findOneAndUpdate(
            { workspace: workspaceId, user: userId },
            payload,
            { new: true, runValidators: true }
        );
    }

    deleteMembership(workspaceId, userId) {
        return WorkspaceMember.findOneAndDelete({ workspace: workspaceId, user: userId });
    }

    findMembers(workspaceId) {
        return WorkspaceMember.find({ workspace: workspaceId, status: { $in: ["active", "invited"] } })
            .populate("user", "firstName lastName email avatar")
            .lean();
    }
}

export default new WorkspaceRepository();
