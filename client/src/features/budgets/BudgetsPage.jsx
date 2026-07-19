import { useEffect, useMemo, useState } from "react";

import { Card, Button, Icon, Badge, EmptyState, Spinner, Modal, Field, Input, Select, ProgressBar } from "../../components/ui";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import { listBudgets, createBudget, deleteBudget } from "../../services/budget.service";
import { listTransactions } from "../../services/transaction.service";
import { BUDGET_PERIODS, categoryEmoji } from "../../constants/finance";
import { formatMoney, idOf, monthRange, titleCase } from "../../utils/format";

function BudgetForm({ onClose, onSaved }) {
  const { ctx, expenseCategories } = useWorkspace();
  const toast = useToast();
  const { start, end } = monthRange();
  const [form, setForm] = useState({
    name: "",
    category: idOf(expenseCategories[0]) || "",
    amount: "",
    period: "monthly",
    startDate: start,
    endDate: end,
    alertThreshold: 80,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Give the budget a name.");
    if (!form.category) return toast.error("Pick a category.");
    if (!(Number(form.amount) > 0)) return toast.error("Enter a budget amount.");
    setSaving(true);
    try {
      await createBudget(ctx, form);
      toast.success("Budget created");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="New budget"
      sub="Cap spending for a category"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : "Create budget"}
          </Button>
        </>
      }
    >
      <Field label="Name">
        <Input placeholder="e.g. Monthly Food" value={form.name} onChange={set("name")} autoFocus />
      </Field>
      <div className="field-row">
        <Field label="Category">
          <Select value={form.category} onChange={set("category")}>
            {expenseCategories.map((c) => (
              <option key={idOf(c)} value={idOf(c)}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Amount">
          <Input type="number" placeholder="10000" value={form.amount} onChange={set("amount")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Period">
          <Select value={form.period} onChange={set("period")}>
            {BUDGET_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Alert at (%)">
          <Input type="number" value={form.alertThreshold} onChange={set("alertThreshold")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Start date">
          <Input type="date" value={form.startDate} onChange={set("startDate")} />
        </Field>
        <Field label="End date">
          <Input type="date" value={form.endDate} onChange={set("endDate")} />
        </Field>
      </div>
    </Modal>
  );
}

export default function BudgetsPage() {
  const { workspaceId, currency } = useWorkspace();
  const toast = useToast();
  const [budgets, setBudgets] = useState([]);
  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        listBudgets(workspaceId),
        listTransactions(workspaceId),
      ]);
      setBudgets(b?.data || []);
      setTx(t?.data || []);
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
      await deleteBudget(id);
      toast.success("Budget deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Spend per budget = expenses in its category within its date window.
  const withSpend = useMemo(() => {
    return budgets.map((b) => {
      const catId = idOf(b.category) || b.category;
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const spent = tx
        .filter((t) => {
          if (t.type !== "expense") return false;
          const tCat = (typeof t.category === "object" ? idOf(t.category) : t.category);
          if (tCat !== catId) return false;
          const d = new Date(t.transactionDate || t.createdAt);
          return d >= start && d <= end;
        })
        .reduce((s, t) => s + Number(t.money?.amount ?? t.amount ?? 0), 0);
      const limit = b.budgetAmount?.amount || 0;
      const pct = limit ? (spent / limit) * 100 : 0;
      return { ...b, spent, limit, pct };
    });
  }, [budgets, tx]);

  const totalBudget = withSpend.reduce((s, b) => s + b.limit, 0);
  const totalSpent = withSpend.reduce((s, b) => s + b.spent, 0);

  const barColor = (b) =>
    b.pct >= 100 ? "var(--red)" : b.pct >= (b.alertThreshold || 80) ? "var(--amber)" : "var(--green)";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Budgets</h2>
          <p>Set limits per category and track spending against them live.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={15} /> New budget
        </Button>
      </div>

      {!loading && budgets.length > 0 && (
        <div className="grid cols-3" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="stat-label">Total budgeted</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{formatMoney(totalBudget, currency)}</div>
          </div>
          <div className="card">
            <div className="stat-label">Total spent</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{formatMoney(totalSpent, currency)}</div>
          </div>
          <div className="card">
            <div className="stat-label">Remaining</div>
            <div className="stat-value" style={{ fontSize: 22, color: totalBudget - totalSpent >= 0 ? "var(--green)" : "var(--red)" }}>
              {formatMoney(totalBudget - totalSpent, currency)}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty"><Spinner /></div>
      ) : !budgets.length ? (
        <Card>
          <EmptyState
            icon="budgets"
            title="No budgets yet"
            hint="Create a budget for a spending category, then add expenses and watch the bar fill up."
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Icon name="plus" size={15} /> New budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid cols-2">
          {withSpend.map((b) => (
            <Card key={idOf(b)}>
              <div className="between" style={{ marginBottom: 14 }}>
                <div className="row">
                  <span className="ic-badge" style={{ background: "var(--surface-2)" }}>
                    {categoryEmoji(b.category?.name || b.name)}
                  </span>
                  <div>
                    <div className="cell-strong">{b.name}</div>
                    <div className="dim" style={{ fontSize: 12 }}>
                      {b.category?.name || "Category"} · {titleCase(b.period)}
                    </div>
                  </div>
                </div>
                <div className="row">
                  {b.pct >= 100 ? (
                    <Badge tone="red">Over budget</Badge>
                  ) : b.pct >= (b.alertThreshold || 80) ? (
                    <Badge tone="amber">Nearing limit</Badge>
                  ) : (
                    <Badge tone="green">On track</Badge>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(idOf(b))}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>

              <div className="between" style={{ marginBottom: 8 }}>
                <span className="num" style={{ fontSize: 16 }}>
                  {formatMoney(b.spent, currency)}
                </span>
                <span className="dim">of {formatMoney(b.limit, currency)}</span>
              </div>
              <ProgressBar value={b.pct} color={barColor(b)} />
              <div className="between" style={{ marginTop: 8 }}>
                <span className="dim" style={{ fontSize: 12 }}>{b.pct.toFixed(0)}% used</span>
                <span className="dim" style={{ fontSize: 12 }}>
                  {formatMoney(Math.max(0, b.limit - b.spent), currency)} left
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && <BudgetForm onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}
