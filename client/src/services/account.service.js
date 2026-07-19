import { get, post, patch } from "./apiClient";

// getAccounts returns { data: [...], pagination }
export const listAccounts = async (workspace) => {
  const res = await get("/accounts", { workspace, limit: 100 });
  return res?.data || res || [];
};

export const createAccount = (workspace, { name, type, currency, openingBalance }) =>
  post("/accounts", {
    workspace,
    name,
    type,
    currency,
    openingBalance: Number(openingBalance) || 0,
  });

// Set the account balance to an exact figure (used to top-up demo accounts).
export const reconcileAccount = (accountId, balance) =>
  patch(`/accounts/${accountId}/reconcile`, { balance: Number(balance) });
