import { useEffect, useState } from "react";

import { Card, Button, Icon, Badge, EmptyState, Spinner, Modal, Field, Input, Select, Textarea, ProgressBar } from "../../components/ui";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import {
  listGoals,
  createGoal,
  deleteGoal,
  contributeGoal,
  withdrawGoal,
} from "../../services/goal.service";
import { GOAL_TYPES } from "../../constants/finance";
import { formatMoney, idOf, formatDate, clamp } from "../../utils/format";

function GoalForm({ onClose, onSaved }) {
  const { ctx } = useWorkspace();
  const toast = useToast();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const [form, setForm] = useState({
    name: "",
    type: "emergency",
    targetAmount: "",
    currentAmount: "",
    targetDate: nextYear.toISOString().slice(0, 10),
    description: "",
    priority: 3,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name your goal.");
    if (!(Number(form.targetAmount) > 0)) return toast.error("Enter a target amount.");
    setSaving(true);
    try {
      await createGoal(ctx, form);
      toast.success("Goal created");
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
      title="New goal"
      sub="Save toward something specific"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : "Create goal"}
          </Button>
        </>
      }
    >
      <Field label="Goal name">
        <Input placeholder="e.g. Emergency Fund" value={form.name} onChange={set("name")} autoFocus />
      </Field>
      <div className="field-row">
        <Field label="Type">
          <Select value={form.type} onChange={set("type")}>
            {GOAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Target date">
          <Input type="date" value={form.targetDate} onChange={set("targetDate")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Target amount">
          <Input type="number" placeholder="200000" value={form.targetAmount} onChange={set("targetAmount")} />
        </Field>
        <Field label="Already saved" hint="Optional starting amount">
          <Input type="number" placeholder="0" value={form.currentAmount} onChange={set("currentAmount")} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea placeholder="Why this matters…" value={form.description} onChange={set("description")} />
      </Field>
    </Modal>
  );
}

function MoveMoneyModal({ goal, mode, onClose, onDone }) {
  const { currency } = useWorkspace();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const isAdd = mode === "add";

  const submit = async () => {
    if (!(Number(amount) > 0)) return toast.error("Enter an amount.");
    setSaving(true);
    try {
      if (isAdd) await contributeGoal(idOf(goal), Number(amount));
      else await withdrawGoal(idOf(goal), Number(amount));
      toast.success(isAdd ? "Contribution added" : "Amount withdrawn");
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
      title={isAdd ? `Add to ${goal.name}` : `Withdraw from ${goal.name}`}
      sub={`Currently ${formatMoney(goal.currentAmount?.amount, currency)} of ${formatMoney(goal.targetAmount?.amount, currency)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : isAdd ? "Add money" : "Withdraw"}
          </Button>
        </>
      }
    >
      <Field label="Amount">
        <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      </Field>
    </Modal>
  );
}

export default function GoalsPage() {
  const { workspaceId, currency } = useWorkspace();
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [move, setMove] = useState(null); // { goal, mode }

  const load = async () => {
    setLoading(true);
    try {
      const g = await listGoals(workspaceId);
      setGoals(g?.data || []);
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
      await deleteGoal(id);
      toast.success("Goal deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const typeMeta = (v) => GOAL_TYPES.find((t) => t.value === v) || GOAL_TYPES[5];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Goals</h2>
          <p>Save toward targets and watch progress grow with every contribution.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={15} /> New goal
        </Button>
      </div>

      {loading ? (
        <div className="empty"><Spinner /></div>
      ) : !goals.length ? (
        <Card>
          <EmptyState
            icon="goals"
            title="No goals yet"
            hint="Create a savings goal, then add contributions to see the progress ring fill up."
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Icon name="plus" size={15} /> New goal
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid cols-2">
          {goals.map((g) => {
            const cur = g.currentAmount?.amount || 0;
            const tgt = g.targetAmount?.amount || 0;
            const pct = tgt ? clamp((cur / tgt) * 100, 0, 100) : 0;
            const done = g.status === "completed" || cur >= tgt;
            const meta = typeMeta(g.type);
            return (
              <Card key={idOf(g)}>
                <div className="between" style={{ marginBottom: 14 }}>
                  <div className="row">
                    <span className="ic-badge" style={{ background: "var(--brand-soft)", fontSize: 20 }}>
                      {meta.icon}
                    </span>
                    <div>
                      <div className="cell-strong">{g.name}</div>
                      <div className="dim" style={{ fontSize: 12 }}>
                        {meta.label} · by {formatDate(g.targetDate)}
                      </div>
                    </div>
                  </div>
                  {done ? <Badge tone="green">Completed</Badge> : <Badge tone="brand">Active</Badge>}
                </div>

                <div className="between" style={{ marginBottom: 8 }}>
                  <span className="num" style={{ fontSize: 18 }}>{formatMoney(cur, currency)}</span>
                  <span className="dim">of {formatMoney(tgt, currency)}</span>
                </div>
                <ProgressBar value={pct} color={done ? "var(--green)" : "var(--brand)"} />
                <div className="between" style={{ marginTop: 8, marginBottom: 16 }}>
                  <span className="dim" style={{ fontSize: 12 }}>{pct.toFixed(0)}% funded</span>
                  <span className="dim" style={{ fontSize: 12 }}>
                    {formatMoney(Math.max(0, tgt - cur), currency)} to go
                  </span>
                </div>

                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="row">
                    <Button size="sm" variant="primary" onClick={() => setMove({ goal: g, mode: "add" })}>
                      <Icon name="plus" size={13} /> Add
                    </Button>
                    <Button size="sm" onClick={() => setMove({ goal: g, mode: "withdraw" })}>
                      Withdraw
                    </Button>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(idOf(g))}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && <GoalForm onClose={() => setShowForm(false)} onSaved={load} />}
      {move && (
        <MoveMoneyModal
          goal={move.goal}
          mode={move.mode}
          onClose={() => setMove(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
