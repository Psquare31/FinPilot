import { get, post } from "./apiClient";

export const listCategories = (workspace) =>
  get("/categories", { workspace });

export const createCategory = (workspace, { name, type, color, icon }) =>
  post("/categories", { workspace, name, type, color, icon });
