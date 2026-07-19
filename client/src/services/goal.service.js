import { get, post, patch, del } from "./apiClient";

export const listGoals = (workspace) => get("/goals", { workspace, limit: 100 });

export const createGoal = (ctx, form) =>
  post("/goals", {
    workspace: ctx.workspace,
    name: form.name,
    type: form.type || "custom",
    description: form.description || "",
    targetAmount: { amount: Number(form.targetAmount), currency: ctx.currency || "INR" },
    currentAmount: {
      amount: Number(form.currentAmount) || 0,
      currency: ctx.currency || "INR",
    },
    targetDate: new Date(form.targetDate).toISOString(),
    priority: Number(form.priority) || 3,
    audit: { createdBy: ctx.userId },
  });

// amount must be a JSON number (controller checks typeof === "number").
export const contributeGoal = (id, amount) =>
  patch(`/goals/${id}/contribute`, { amount: Number(amount) });

export const withdrawGoal = (id, amount) =>
  patch(`/goals/${id}/withdraw`, { amount: Number(amount) });

export const deleteGoal = (id) => del(`/goals/${id}`);
