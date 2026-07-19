import { useState } from "react";

import { Modal, Button, Field, Input, Select, Spinner, Icon } from "../../components/ui";
import { PAYMENT_METHODS } from "../../constants/finance";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import { createTransaction } from "../../services/transaction.service";
import { formatMoney, idOf, todayISO } from "../../utils/format";
import AccountForm from "../accounts/AccountForm";

export default function TransactionForm({ onClose, onSaved }) {
  const { ctx, accounts, incomeCategories, expenseCategories } = useWorkspace();
  const toast = useToast();
  const [showAccount, setShowAccount] = useState(false);

  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    account: idOf(accounts[0]) || "",
    category: "",
    description: "",
    merchant: "",
    paymentMethod: "upi",
    transactionDate: todayISO(),
  });
  const [saving, setSaving] = useState(false);

  const cats = form.type === "income" ? incomeCategories : expenseCategories;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.account) return toast.error("Pick an account (create one first).");
    if (!form.category) return toast.error("Pick a category.");
    if (!(Number(form.amount) > 0)) return toast.error("Enter an amount greater than 0.");

    setSaving(true);
    try {
      await createTransaction(ctx, form);
      toast.success(
        `${form.type === "income" ? "Income" : "Expense"} of ${formatMoney(
          form.amount,
          ctx.currency
        )} recorded`
      );
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (showAccount) {
    return (
      <AccountForm
        onClose={() => setShowAccount(false)}
        onSaved={() => {
          /* accounts refreshed in store */
        }}
      />
    );
  }

  return (
    <Modal
      title="Add transaction"
      sub="Record income or an expense"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : "Save transaction"}
          </Button>
        </>
      }
    >
      <div className="field">
        <label>Type</label>
        <div className="seg">
          <button
            className={form.type === "expense" ? "on expense" : ""}
            onClick={() => setForm({ ...form, type: "expense", category: "" })}
          >
            Expense
          </button>
          <button
            className={form.type === "income" ? "on income" : ""}
            onClick={() => setForm({ ...form, type: "income", category: "" })}
          >
            Income
          </button>
        </div>
      </div>

      <Field label="Amount">
        <Input
          type="number"
          placeholder="0.00"
          value={form.amount}
          onChange={set("amount")}
          autoFocus
        />
      </Field>

      <div className="field-row">
        <Field label="Account">
          {accounts.length ? (
            <Select value={form.account} onChange={set("account")}>
              {accounts.map((a) => (
                <option key={idOf(a)} value={idOf(a)}>
                  {a.name} · {formatMoney(a.balance, a.currency)}
                </option>
              ))}
            </Select>
          ) : (
            <Button variant="" onClick={() => setShowAccount(true)}>
              <Icon name="plus" size={14} /> Create account
            </Button>
          )}
        </Field>
        <Field label="Category">
          <Select value={form.category} onChange={set("category")}>
            <option value="">Select…</option>
            {cats.map((c) => (
              <option key={idOf(c)} value={idOf(c)}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="field-row">
        <Field label="Date">
          <Input type="date" value={form.transactionDate} onChange={set("transactionDate")} />
        </Field>
        <Field label="Payment method">
          <Select value={form.paymentMethod} onChange={set("paymentMethod")}>
            {PAYMENT_METHODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description">
        <Input
          placeholder="e.g. Groceries at BigBasket"
          value={form.description}
          onChange={set("description")}
        />
      </Field>
    </Modal>
  );
}
