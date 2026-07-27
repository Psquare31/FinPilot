import { Router } from "express";

import workspaceController from "./workspace.controller.js";

import validate from "../../middlewares/validate.js";
import requireAuth from "../../middlewares/authenticate.js";

import {
  createWorkspaceSchema,
  getWorkspaceSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
  updateMemberSchema,
  removeMemberSchema,
  getMembersSchema,
  transferOwnershipSchema,
} from "./workspace.validation.js";

const router = Router();

router.use(requireAuth);

// ======================================================
// Workspace
// ======================================================

router.post(
  "/",
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace
);

router.get(
  "/",
  workspaceController.getUserWorkspaces
);

router.get(
  "/:workspaceId",
  validate(getWorkspaceSchema),
  workspaceController.getWorkspaceById
);

router.patch(
  "/:workspaceId",
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace
);

router.delete(
  "/:workspaceId",
  validate(deleteWorkspaceSchema),
  workspaceController.deleteWorkspace
);

// ======================================================
// Members
// ======================================================

router.get(
  "/:workspaceId/members",
  validate(getMembersSchema),
  workspaceController.getMembers
);

router.post(
  "/:workspaceId/members/invite",
  validate(inviteMemberSchema),
  workspaceController.inviteMember
);

router.get(
  "/invitations/pending",
  workspaceController.getPendingInvitations
);

router.patch(
  "/:workspaceId/members/accept",
  validate(acceptInvitationSchema),
  workspaceController.acceptInvitation
);

router.delete(
  "/:workspaceId/members/decline",
  validate(acceptInvitationSchema),
  workspaceController.declineInvitation
);

router.patch(
  "/:workspaceId/members/:memberId/role",
  validate(updateMemberSchema),
  workspaceController.updateMemberRole
);

router.delete(
  "/:workspaceId/members/:memberId",
  validate(removeMemberSchema),
  workspaceController.removeMember
);

router.patch(
  "/:workspaceId/transfer-ownership",
  validate(transferOwnershipSchema),
  workspaceController.transferOwnership
);

export default router;