import { get, post, patch, del } from "./apiClient";

// Returns { data: [...], pagination }
export const listTransactions = (workspace, params = {}) =>
  get("/transactions", { workspace, limit: 100, ...params });

// The transaction controller passes the raw body to the service/model, which
// (as implemented) expects `workspace`, a flat `amount` for the balance math,
// a `money` subdocument, and `audit.createdBy`. We assemble all of them here.
export const createTransaction = (ctx, form) => {
  const amount = Number(form.amount);
  return post("/transactions", {
    workspace: ctx.workspace,
    account: form.account,
    category: form.category,
    type: form.type,
    amount,
    money: { amount, currency: ctx.currency || "INR" },
    paymentMethod: form.paymentMethod || "upi",
    description: form.description || "",
    merchant: form.merchant ? { name: form.merchant } : undefined,
    transactionDate: form.transactionDate
      ? new Date(form.transactionDate).toISOString()
      : new Date().toISOString(),
    audit: { createdBy: ctx.userId },
  });
};

export const deleteTransaction = (id) => del(`/transactions/${id}`);
