import { useEffect, useMemo, useState } from "react";

import { Card, StatCard, Button, Icon, Badge, Spinner, ProgressBar } from "../../components/ui";
import { Donut, GroupedBars, AreaLine } from "../../components/charts";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import { listTransactions } from "../../services/transaction.service";
import { listInvestments } from "../../services/investment.service";
import {
  formatMoney,
  formatCompact,
  formatDate,
  idOf,
} from "../../utils/format";
import { CHART_COLORS, categoryEmoji } from "../../constants/finance";
import TransactionForm from "../transactions/TransactionForm";

const monthLabel = (d) => d.toLocaleDateString("en-IN", { month: "short" });

export default function DashboardPage() {
  const { workspaceId, accounts, categories, currency } = useWorkspace();
  const toast = useToast();
  const [tx, setTx] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const catMap = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[idOf(c)] = c));
    return m;
  }, [categories]);

  const load = async () => {
    setLoading(true);
    try {
      const [t, inv] = await Promise.all([
        listTransactions(workspaceId),
        listInvestments(workspaceId),
      ]);
      setTx(t?.data || []);
      setInvestments(inv?.data || []);
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

  const amountOf = (t) => Number(t.money?.amount ?? t.amount ?? 0);

  const stats = useMemo(() => {
    const accountsTotal = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const investValue = investments.reduce(
      (s, i) => s + (i.quantity || 0) * (i.currentPrice?.amount || 0),
      0
    );
    const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + amountOf(t), 0);
    const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + amountOf(t), 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    return {
      netWorth: accountsTotal + investValue,
      accountsTotal,
      investValue,
      income,
      expense,
      savingsRate,
    };
  }, [tx, accounts, investments]);

  // Spending by category (expenses)
  const byCategory = useMemo(() => {
    const map = {};
    tx.filter((t) => t.type === "expense").forEach((t) => {
      const name =
        (typeof t.category === "object" && t.category?.name) ||
        catMap[t.category]?.name ||
        "Other";
      map[name] = (map[name] || 0) + amountOf(t);
    });
    return Object.entries(map)
      .map(([label, value], i) => ({ label, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [tx, catMap]);

  // Monthly series (last 6 months)
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabel(d), income: 0, expense: 0 });
    }
    const idx = {};
    buckets.forEach((b, i) => (idx[b.key] = i));
    tx.forEach((t) => {
      const d = new Date(t.transactionDate || t.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in idx) {
        if (t.type === "income") buckets[idx[key]].income += amountOf(t);
        if (t.type === "expense") buckets[idx[key]].expense += amountOf(t);
      }
    });
    return buckets;
  }, [tx]);

  const trend = monthly.map((m) => ({ label: m.label, value: m.income - m.expense }));

  const recent = [...tx]
    .sort((a, b) => new Date(b.transactionDate || b.createdAt) - new Date(a.transactionDate || a.createdAt))
    .slice(0, 6);

  const catName = (t) =>
    (typeof t.category === "object" && t.category?.name) || catMap[t.category]?.name || "Other";

  if (loading) {
    return (
      <div className="page">
        <div className="empty"><Spinner /></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Overview</h2>
          <p>Your complete financial picture, updated in real time.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={15} /> Add transaction
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <StatCard
          label="Net Worth"
          value={formatMoney(stats.netWorth, currency)}
          icon={<Icon name="wallet" size={16} />}
          iconBg="var(--brand-soft)"
          delta={`${formatCompact(stats.investValue, currency)} invested`}
        />
        <StatCard
          label="Total Income"
          value={formatMoney(stats.income, currency)}
          icon={<Icon name="arrowDown" size={16} />}
          iconBg="var(--green-soft)"
        />
        <StatCard
          label="Total Expenses"
          value={formatMoney(stats.expense, currency)}
          icon={<Icon name="arrowUp" size={16} />}
          iconBg="var(--red-soft)"
        />
        <StatCard
          label="Savings Rate"
          value={`${stats.savingsRate.toFixed(0)}%`}
          icon={<Icon name="trendingUp" size={16} />}
          iconBg="var(--amber-soft)"
          delta={stats.savingsRate >= 0 ? "Net positive" : "Overspending"}
          deltaDir={stats.savingsRate >= 0 ? "up" : "down"}
        />
      </div>

      {/* Cashflow + Spending */}
      <div className="grid cols-2" style={{ marginBottom: 18, gridTemplateColumns: "1.5fr 1fr" }}>
        <Card title="Net Cash Flow" sub="Income minus expenses, last 6 months">
          <AreaLine points={trend} />
        </Card>

        <Card title="Spending by Category">
          {byCategory.length ? (
            <div className="row" style={{ gap: 22, alignItems: "center" }}>
              <Donut
                data={byCategory}
                center={
                  <div>
                    <div className="dim" style={{ fontSize: 11 }}>Total</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>
                      {formatCompact(stats.expense, currency)}
                    </div>
                  </div>
                }
              />
              <div className="chart-legend" style={{ flex: 1 }}>
                {byCategory.map((c) => (
                  <div className="legend-item" key={c.label}>
                    <span className="lg-left">
                      <span className="cat-dot" style={{ background: c.color }} />
                      <span className="lg-name">{c.label}</span>
                    </span>
                    <span className="num">{formatMoney(c.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dim" style={{ padding: "36px 0", textAlign: "center" }}>
              No expenses recorded yet.
            </div>
          )}
        </Card>
      </div>

      {/* Bars + Recent */}
      <div className="grid cols-2" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        <Card
          title="Income vs Expenses"
          sub="Monthly comparison"
          action={
            <div className="row" style={{ gap: 14 }}>
              <span className="row" style={{ gap: 6, fontSize: 12 }}>
                <span className="cat-dot" style={{ background: "var(--green)" }} /> Income
              </span>
              <span className="row" style={{ gap: 6, fontSize: 12 }}>
                <span className="cat-dot" style={{ background: "var(--red)" }} /> Expense
              </span>
            </div>
          }
        >
          <GroupedBars series={monthly} />
        </Card>

        <Card
          title="Recent Activity"
          action={
            <Badge tone="brand">{tx.length} total</Badge>
          }
        >
          {recent.length ? (
            recent.map((t) => (
              <div className="list-item" key={idOf(t)}>
                <span className="ic-badge" style={{ background: "var(--surface-2)" }}>
                  {categoryEmoji(catName(t))}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.description || catName(t)}
                  </div>
                  <div className="dim" style={{ fontSize: 11.5 }}>{formatDate(t.transactionDate)}</div>
                </div>
                <span
                  className="num"
                  style={{ color: t.type === "income" ? "var(--green)" : "var(--red)" }}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatMoney(amountOf(t), currency)}
                </span>
              </div>
            ))
          ) : (
            <div className="dim" style={{ padding: "36px 0", textAlign: "center" }}>
              No activity yet.
            </div>
          )}
        </Card>
      </div>

      {showForm && (
        <TransactionForm onClose={() => setShowForm(false)} onSaved={load} />
      )}
    </div>
  );
}
