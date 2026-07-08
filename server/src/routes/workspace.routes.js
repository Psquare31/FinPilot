import { Router } from "express";

import {
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
} from "../controllers/workspace.controller.js";

import validate from "../middlewares/validate.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from "../validators/workspace.validator.js";

const router = Router();

router.use(requireAuth);

// Workspace
router.post(
  "/",
  validate(createWorkspaceSchema),
  createWorkspace
);

router.get("/", getUserWorkspaces);

router.get("/:id", getWorkspaceById);

router.patch(
  "/:id",
  validate(updateWorkspaceSchema),
  updateWorkspace
);

router.delete("/:id", deleteWorkspace);

// Members
router.get("/:id/members", getMembers);

router.post(
  "/:id/members/invite",
  validate(inviteMemberSchema),
  inviteMember
);

router.patch(
  "/:id/members/accept",
  acceptInvitation
);

router.patch(
  "/:id/members/:memberId/role",
  validate(updateMemberRoleSchema),
  updateMemberRole
);

router.delete(
  "/:id/members/:memberId",
  removeMember
);

router.patch(
  "/:id/transfer-ownership",
  validate(transferOwnershipSchema),
  transferOwnership
);

export default router;