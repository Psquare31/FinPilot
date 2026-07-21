import { get, post, patch, del } from "./apiClient";

// Returns { data: [...], pagination }
export const listTransactions = (workspace, params = {}) =>
  get("/transactions", { workspace, limit: 100, ...params });

// The server derives `workspace` from the account and `audit.createdBy` from
// the authenticated session, and reads the amount from `money.amount` — so we
// send only what the caller actually owns.
export const createTransaction = (ctx, form) => {
  const amount = Number(form.amount);
  return post("/transactions", {
    account: form.account,
    category: form.category,
    type: form.type,
    money: { amount, currency: ctx.currency || "INR" },
    paymentMethod: form.paymentMethod || "upi",
    description: form.description || "",
    merchant: form.merchant ? { name: form.merchant } : undefined,
    transactionDate: form.transactionDate
      ? new Date(form.transactionDate).toISOString()
      : new Date().toISOString(),
  });
};

export const updateTransaction = (id, patchBody) =>
  patch(`/transactions/${id}`, patchBody);

export const deleteTransaction = (id) => del(`/transactions/${id}`);

export const transferBetweenAccounts = (ctx, form) => {
  const amount = Number(form.amount);
  return post("/transactions/transfer", {
    fromAccount: form.fromAccount,
    toAccount: form.toAccount,
    category: form.category,
    money: { amount, currency: ctx.currency || "INR" },
    description: form.description || "",
    transactionDate: form.transactionDate
      ? new Date(form.transactionDate).toISOString()
      : new Date().toISOString(),
  });
};

export const getTransactionStatistics = (workspace) =>
  get("/transactions/statistics", { workspace });

export const getCashFlow = (workspace, startDate, endDate) =>
  get("/transactions/cash-flow", { workspace, startDate, endDate });

export const getSpendingByCategory = (workspace) =>
  get("/transactions/spending-by-category", { workspace });
