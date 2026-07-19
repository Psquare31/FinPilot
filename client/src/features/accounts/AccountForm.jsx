import { useState } from "react";

import { Modal, Button, Field, Input, Select, Spinner } from "../../components/ui";
import { ACCOUNT_TYPES, CURRENCIES } from "../../constants/finance";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import { createAccount } from "../../services/account.service";

export default function AccountForm({ onClose, onSaved }) {
  const { workspaceId, currency, refreshAccounts } = useWorkspace();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    type: "savings",
    currency,
    openingBalance: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      return toast.error("Account name must be at least 2 characters.");
    }
    setSaving(true);
    try {
      await createAccount(workspaceId, form);
      await refreshAccounts();
      toast.success("Account created");
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="New account"
      sub="Bank, cash, card or wallet"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : "Create account"}
          </Button>
        </>
      }
    >
      <Field label="Account name">
        <Input placeholder="e.g. HDFC Savings" value={form.name} onChange={set("name")} autoFocus />
      </Field>
      <div className="field-row">
        <Field label="Type">
          <Select value={form.type} onChange={set("type")}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Currency">
          <Select value={form.currency} onChange={set("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Opening balance" hint="Starting money in this account">
        <Input
          type="number"
          placeholder="0"
          value={form.openingBalance}
          onChange={set("openingBalance")}
        />
      </Field>
    </Modal>
  );
}
