import { get, post, patch, del } from "./apiClient";

export const listWorkspaces = () => get("/workspaces");

export const createWorkspace = (name, currency = "INR") =>
  post("/workspaces", { name, currency });

export const updateWorkspace = (id, payload) =>
  patch(`/workspaces/${id}`, payload);

export const deleteWorkspace = (id) =>
  del(`/workspaces/${id}`);

export const listMembers = (workspaceId) =>
  get(`/workspaces/${workspaceId}/members`);

export const inviteMember = (workspaceId, email, role) =>
  post(`/workspaces/${workspaceId}/members/invite`, { email, role });

export const listPendingInvitations = () =>
  get("/workspaces/invitations/pending");

export const acceptInvitation = (workspaceId) =>
  patch(`/workspaces/${workspaceId}/members/accept`, {});

export const declineInvitation = (workspaceId) =>
  del(`/workspaces/${workspaceId}/members/decline`);

export const updateMemberRole = (workspaceId, memberId, role) =>
  patch(`/workspaces/${workspaceId}/members/${memberId}/role`, { role });

export const removeMember = (workspaceId, memberId) =>
  del(`/workspaces/${workspaceId}/members/${memberId}`);

export const transferOwnership = (workspaceId, newOwnerId) =>
  patch(`/workspaces/${workspaceId}/transfer-ownership`, { newOwnerId });