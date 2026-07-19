import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

import { getMe } from "../services/auth.service";
import { listWorkspaces, createWorkspace } from "../services/workspace.service";
import { listCategories, createCategory } from "../services/category.service";
import { listAccounts } from "../services/account.service";
import { DEFAULT_CATEGORIES } from "../constants/finance";
import { idOf } from "../utils/format";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [state, setState] = useState({ loading: true, error: null });
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const workspaceId = idOf(workspace);
  const currency = workspace?.currency || "INR";

  const refreshCategories = useCallback(async () => {
    if (!workspaceId) return [];
    const cats = await listCategories(workspaceId);
    setCategories(cats || []);
    return cats || [];
  }, [workspaceId]);

  const refreshAccounts = useCallback(async () => {
    if (!workspaceId) return [];
    const accs = await listAccounts(workspaceId);
    setAccounts(accs || []);
    return accs || [];
  }, [workspaceId]);

  const bootstrap = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      // 1. Who am I (demo user in DEMO_AUTH mode)
      const me = await getMe();
      setUser(me);

      // 2. Workspace — reuse the first, or create one
      let workspaces = await listWorkspaces();
      if (!workspaces || workspaces.length === 0) {
        const created = await createWorkspace("My Finances", "INR");
        workspaces = [created];
      }
      const ws = workspaces[0];
      setWorkspace(ws);
      const wsId = idOf(ws);

      // 3. Categories — seed defaults on a fresh workspace
      let cats = await listCategories(wsId);
      if (!cats || cats.length === 0) {
        for (const c of DEFAULT_CATEGORIES) {
          try {
            await createCategory(wsId, c);
          } catch {
            /* ignore duplicates */
          }
        }
        cats = await listCategories(wsId);
      }
      setCategories(cats || []);

      // 4. Accounts (may be empty; user can add)
      const accs = await listAccounts(wsId);
      setAccounts(accs || []);

      setState({ loading: false, error: null });
    } catch (error) {
      setState({ loading: false, error: error.message || "Failed to load" });
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const ctx = useMemo(
    () => ({ workspace: workspaceId, userId: idOf(user), currency }),
    [workspaceId, user, currency]
  );

  const value = {
    ...state,
    user,
    workspace,
    workspaceId,
    currency,
    categories,
    accounts,
    ctx,
    incomeCategories: categories.filter((c) => c.type === "income"),
    expenseCategories: categories.filter((c) => c.type === "expense"),
    refreshCategories,
    refreshAccounts,
    retry: bootstrap,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => useContext(WorkspaceContext);
