import { useState } from "react";

import { Card, Button, Field, Input, Spinner } from "../../components/ui";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import { updateWorkspace } from "../../services/workspace.service";
import TeamTab from "./TeamTab";

export default function SettingsPage() {
  const { workspace, workspaceId, retry } = useWorkspace();
  const toast = useToast();
  const [name, setName] = useState(workspace?.name || "");
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    if (!name.trim()) return toast.error("Workspace name can't be empty.");
    setSaving(true);
    try {
      await updateWorkspace(workspaceId, { name: name.trim() });
      toast.success("Workspace updated");
      retry?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p>Manage your workspace and team.</p>
        </div>
      </div>

      <Card title="Workspace" sub="Basic details for this workspace" style={{ marginBottom: 18 }}>
        <div className="field-row">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <Button variant="primary" size="sm" onClick={saveName} disabled={saving}>
          {saving ? <Spinner /> : "Save changes"}
        </Button>
      </Card>

      <TeamTab />
    </div>
  );
}
