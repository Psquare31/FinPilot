import { get, post, patch, del } from "./apiClient";

export const listInvestments = (workspace) =>
  get("/investments", { workspace, limit: 100 });

export const createInvestment = (ctx, form) =>
  post("/investments", {
    workspace: ctx.workspace,
    name: form.name,
    symbol: form.symbol || undefined,
    type: form.type || "stock",
    quantity: Number(form.quantity),
    purchasePrice: { amount: Number(form.purchasePrice), currency: ctx.currency || "INR" },
    currentPrice: {
      amount: Number(form.currentPrice || form.purchasePrice),
      currency: ctx.currency || "INR",
    },
    purchaseDate: new Date(form.purchaseDate).toISOString(),
    riskLevel: form.riskLevel || "medium",
    broker: form.broker || "",
    audit: { createdBy: ctx.userId },
  });

// currentPrice must be a JSON number (controller checks typeof === "number").
export const updateCurrentPrice = (id, currentPrice) =>
  patch(`/investments/${id}/current-price`, { currentPrice: Number(currentPrice) });

export const deleteInvestment = (id) => del(`/investments/${id}`);
