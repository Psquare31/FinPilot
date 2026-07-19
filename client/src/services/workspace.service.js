import { get, post } from "./apiClient";

export const listWorkspaces = () => get("/workspaces");

export const createWorkspace = (name, currency = "INR") =>
  post("/workspaces", { name, currency });
