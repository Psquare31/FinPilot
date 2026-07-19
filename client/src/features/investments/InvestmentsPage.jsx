import { useEffect, useMemo, useState } from "react";

import { Card, Button, Icon, Badge, EmptyState, Spinner, Modal, Field, Input, Select } from "../../components/ui";
import { Donut } from "../../components/charts";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import {
  listInvestments,
  createInvestment,
  deleteInvestment,
  updateCurrentPrice,
} from "../../services/investment.service";
import { INVESTMENT_TYPES, RISK_LEVELS, CHART_COLORS } from "../../constants/finance";
import { formatMoney, formatCompact, idOf, todayISO, titleCase } from "../../utils/format";

function InvestmentForm({ onClose, onSaved }) {
  const { ctx } = useWorkspace();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    type: "stock",
    quantity: "",
    purchasePrice: "",
    currentPrice: "",
    purchaseDate: todayISO(),
    riskLevel: "medium",
    broker: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name the holding.");
    if (!(Number(form.quantity) > 0)) return toast.error("Enter quantity.");
    if (!(Number(form.purchasePrice) > 0)) return toast.error("Enter a buy price.");
    setSaving(true);
    try {
      await createInvestment(ctx, form);
      toast.success("Investment added");
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
      title="Add investment"
      sub="Track a holding in your portfolio"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : "Add holding"}
          </Button>
        </>
      }
    >
      <div className="field-row">
        <Field label="Name">
          <Input placeholder="e.g. Reliance Industries" value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label="Symbol">
          <Input placeholder="RELIANCE" value={form.symbol} onChange={set("symbol")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Type">
          <Select value={form.type} onChange={set("type")}>
            {INVESTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Risk level">
          <Select value={form.riskLevel} onChange={set("riskLevel")}>
            {RISK_LEVELS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="field-row">
        <Field label="Quantity">
          <Input type="number" placeholder="10" value={form.quantity} onChange={set("quantity")} />
        </Field>
        <Field label="Buy price / unit">
          <Input type="number" placeholder="2400" value={form.purchasePrice} onChange={set("purchasePrice")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Current price / unit" hint="Defaults to buy price">
          <Input type="number" placeholder="2900" value={form.currentPrice} onChange={set("currentPrice")} />
        </Field>
        <Field label="Buy date">
          <Input type="date" value={form.purchaseDate} onChange={set("purchaseDate")} />
        </Field>
      </div>
    </Modal>
  );
}

function PriceModal({ inv, onClose, onDone }) {
  const { currency } = useWorkspace();
  const toast = useToast();
  const [price, setPrice] = useState(String(inv.currentPrice?.amount ?? ""));
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!(Number(price) >= 0)) return toast.error("Enter a valid price.");
    setSaving(true);
    try {
      await updateCurrentPrice(idOf(inv), Number(price));
      toast.success("Price updated");
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Update ${inv.name} price`}
      sub={`Bought at ${formatMoney(inv.purchasePrice?.amount, currency)} / unit`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : "Update price"}
          </Button>
        </>
      }
    >
      <Field label="Current market price / unit">
        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} autoFocus />
      </Field>
    </Modal>
  );
}

export default function InvestmentsPage() {
  const { workspaceId, currency } = useWorkspace();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [priceFor, setPriceFor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await listInvestments(workspaceId);
      setRows(r?.data || []);
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
      await deleteInvestment(id);
      toast.success("Investment removed");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const enriched = rows.map((i) => {
    const qty = i.quantity || 0;
    const buy = i.purchasePrice?.amount || 0;
    const now = i.currentPrice?.amount || 0;
    const invested = qty * buy;
    const value = qty * now;
    const pl = value - invested;
    const plPct = invested ? (pl / invested) * 100 : 0;
    return { ...i, qty, buy, now, invested, value, pl, plPct };
  });

  const totals = useMemo(() => {
    const invested = enriched.reduce((s, i) => s + i.invested, 0);
    const value = enriched.reduce((s, i) => s + i.value, 0);
    const pl = value - invested;
    return { invested, value, pl, plPct: invested ? (pl / invested) * 100 : 0 };
  }, [enriched]);

  const allocation = useMemo(() => {
    const map = {};
    enriched.forEach((i) => {
      const label = titleCase(i.type);
      map[label] = (map[label] || 0) + i.value;
    });
    return Object.entries(map).map(([label, value], idx) => ({
      label,
      value,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [enriched]);

  const typeMeta = (v) => INVESTMENT_TYPES.find((t) => t.value === v) || INVESTMENT_TYPES[0];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Investments</h2>
          <p>Track holdings and see profit/loss update as prices move.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={15} /> Add investment
        </Button>
      </div>

      {!loading && rows.length > 0 && (
        <>
          <div className="grid cols-4" style={{ marginBottom: 18 }}>
            <div className="card">
              <div className="stat-label">Invested</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{formatMoney(totals.invested, currency)}</div>
            </div>
            <div className="card">
              <div className="stat-label">Current Value</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{formatMoney(totals.value, currency)}</div>
            </div>
            <div className="card">
              <div className="stat-label">Total P/L</div>
              <div className="stat-value" style={{ fontSize: 22, color: totals.pl >= 0 ? "var(--green)" : "var(--red)" }}>
                {totals.pl >= 0 ? "+" : "−"}{formatMoney(Math.abs(totals.pl), currency)}
              </div>
            </div>
            <div className="card">
              <div className="stat-label">Return</div>
              <div className="stat-value" style={{ fontSize: 22, color: totals.plPct >= 0 ? "var(--green)" : "var(--red)" }}>
                {totals.plPct >= 0 ? "+" : ""}{totals.plPct.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid cols-2" style={{ gridTemplateColumns: "1fr 1.6fr", marginBottom: 18 }}>
            <Card title="Allocation" sub="By current value">
              <div className="row" style={{ gap: 20, alignItems: "center" }}>
                <Donut
                  data={allocation}
                  center={
                    <div>
                      <div className="dim" style={{ fontSize: 11 }}>Value</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{formatCompact(totals.value, currency)}</div>
                    </div>
                  }
                />
                <div className="chart-legend" style={{ flex: 1 }}>
                  {allocation.map((a) => (
                    <div className="legend-item" key={a.label}>
                      <span className="lg-left">
                        <span className="cat-dot" style={{ background: a.color }} />
                        <span className="lg-name">{a.label}</span>
                      </span>
                      <span className="num">{formatMoney(a.value, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Holdings" sub="Tap a row's price to mark-to-market">
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Holding</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Avg / Now</th>
                      <th style={{ textAlign: "right" }}>Value</th>
                      <th style={{ textAlign: "right" }}>P/L</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map((i) => (
                      <tr key={idOf(i)}>
                        <td className="cell-strong">
                          <div className="row">
                            <span className="ic-badge" style={{ width: 32, height: 32, fontSize: 15, background: "var(--surface-2)" }}>
                              {typeMeta(i.type).icon}
                            </span>
                            <div>
                              {i.name}
                              <div className="dim" style={{ fontSize: 11 }}>
                                {i.symbol || titleCase(i.type)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="num" style={{ textAlign: "right" }}>{i.qty}</td>
                        <td className="num" style={{ textAlign: "right" }}>
                          {formatMoney(i.buy, currency)}
                          <div className="dim" style={{ fontSize: 11 }}>{formatMoney(i.now, currency)}</div>
                        </td>
                        <td className="num" style={{ textAlign: "right" }}>{formatMoney(i.value, currency)}</td>
                        <td className="num" style={{ textAlign: "right", color: i.pl >= 0 ? "var(--green)" : "var(--red)" }}>
                          {i.pl >= 0 ? "+" : "−"}{formatCompact(Math.abs(i.pl), currency)}
                          <div style={{ fontSize: 11 }}>{i.plPct >= 0 ? "+" : ""}{i.plPct.toFixed(1)}%</div>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button className="btn btn-sm" onClick={() => setPriceFor(i)} title="Update price">
                            <Icon name="edit" size={13} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(idOf(i))}>
                            <Icon name="trash" size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      {loading ? (
        <div className="empty"><Spinner /></div>
      ) : !rows.length ? (
        <Card>
          <EmptyState
            icon="investments"
            title="No investments yet"
            hint="Add a stock, mutual fund or crypto holding, then update its price to watch profit/loss change live."
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Icon name="plus" size={15} /> Add investment
              </Button>
            }
          />
        </Card>
      ) : null}

      {showForm && <InvestmentForm onClose={() => setShowForm(false)} onSaved={load} />}
      {priceFor && (
        <PriceModal inv={priceFor} onClose={() => setPriceFor(null)} onDone={load} />
      )}
    </div>
  );
}
