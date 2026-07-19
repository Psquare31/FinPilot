import { get, post, del } from "./apiClient";

export const listBudgets = (workspace) =>
  get("/budgets", { workspace, limit: 100 });

export const createBudget = (ctx, form) =>
  post("/budgets", {
    workspace: ctx.workspace,
    category: form.category,
    name: form.name,
    period: form.period || "monthly",
    budgetAmount: { amount: Number(form.amount), currency: ctx.currency || "INR" },
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    alertThreshold: Number(form.alertThreshold) || 80,
    audit: { createdBy: ctx.userId },
  });

export const deleteBudget = (id) => del(`/budgets/${id}`);
