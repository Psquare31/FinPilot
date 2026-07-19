import { useEffect, useMemo, useState } from "react";

import { Button, Card, Icon, Badge, EmptyState, Spinner } from "../../components/ui";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import { listTransactions, deleteTransaction } from "../../services/transaction.service";
import { formatMoney, formatDate, idOf, titleCase } from "../../utils/format";
import { categoryEmoji } from "../../constants/finance";
import TransactionForm from "./TransactionForm";
import AccountForm from "../accounts/AccountForm";

export default function TransactionsPage() {
  const { workspaceId, accounts, categories, currency } = useWorkspace();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const catMap = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[idOf(c)] = c));
    return m;
  }, [categories]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTransactions(workspaceId);
      setRows(res?.data || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const remove = async (id) => {
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const catName = (t) =>
    (typeof t.category === "object" && t.category?.name) ||
    catMap[t.category]?.name ||
    "Uncategorised";

  const filtered = rows.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${t.description || ""} ${catName(t)} ${t.merchant?.name || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const onSaved = () => load();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Transactions</h2>
          <p>Record income and expenses — balances update live.</p>
        </div>
        <div className="row">
          <Button onClick={() => setShowAccount(true)}>
            <Icon name="wallet" size={15} /> Account
          </Button>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={15} /> Add transaction
          </Button>
        </div>
      </div>

      {/* Accounts strip */}
      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        {accounts.map((a) => (
          <div className="card" key={idOf(a)} style={{ padding: 16 }}>
            <div className="stat-label">
              <span className="ic-badge" style={{ width: 30, height: 30, fontSize: 15, background: "var(--brand-soft)" }}>
                🏦
              </span>
              {a.name}
            </div>
            <div className="stat-value" style={{ fontSize: 21, marginTop: 10 }}>
              {formatMoney(a.balance, a.currency)}
            </div>
            <div className="dim" style={{ fontSize: 11.5, marginTop: 2 }}>{titleCase(a.type)}</div>
          </div>
        ))}
        {!accounts.length && (
          <div className="card" style={{ padding: 16 }}>
            <div className="muted" style={{ marginBottom: 10 }}>No accounts yet</div>
            <Button variant="primary" size="sm" onClick={() => setShowAccount(true)}>
              <Icon name="plus" size={13} /> Create account
            </Button>
          </div>
        )}
      </div>

      <Card>
        <div className="between" style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div className="filters">
            {["all", "income", "expense"].map((t) => (
              <button
                key={t}
                className={`tag ${typeFilter === t ? "on" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {titleCase(t)}
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              style={{ paddingLeft: 34, width: 240 }}
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span style={{ position: "absolute", left: 11, top: 10, color: "var(--text-dim)" }}>
              <Icon name="search" size={15} />
            </span>
          </div>
        </div>

        {loading ? (
          <div className="empty"><Spinner /></div>
        ) : !filtered.length ? (
          <EmptyState
            icon="transactions"
            title="No transactions yet"
            hint="Add your first income or expense to see it here and watch account balances change."
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Icon name="plus" size={15} /> Add transaction
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const acc =
                    (typeof t.account === "object" && t.account?.name) ||
                    accounts.find((a) => idOf(a) === t.account)?.name ||
                    "—";
                  const isIncome = t.type === "income";
                  return (
                    <tr key={idOf(t)}>
                      <td className="cell-strong">
                        <div className="row">
                          <span className="ic-badge" style={{ width: 34, height: 34, fontSize: 16, background: "var(--surface-2)" }}>
                            {categoryEmoji(catName(t))}
                          </span>
                          <div>
                            {t.description || catName(t)}
                            {t.merchant?.name && (
                              <div className="dim" style={{ fontSize: 11 }}>{t.merchant.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><Badge tone="gray">{catName(t)}</Badge></td>
                      <td className="muted">{acc}</td>
                      <td className="muted">{formatDate(t.transactionDate)}</td>
                      <td className="num" style={{ textAlign: "right", color: isIncome ? "var(--green)" : "var(--red)" }}>
                        {isIncome ? "+" : "−"}
                        {formatMoney(t.money?.amount ?? t.amount, currency)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(idOf(t))}>
                          <Icon name="trash" size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} onSaved={onSaved} />}
      {showAccount && (
        <AccountForm onClose={() => setShowAccount(false)} onSaved={() => load()} />
      )}
    </div>
  );
}
