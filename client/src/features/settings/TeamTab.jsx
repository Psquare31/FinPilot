import { useEffect, useState } from "react";

import { Card, Button, Icon, Badge, Field, Input, Select, Spinner } from "../../components/ui";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import {
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from "../../services/workspace.service";
import { WORKSPACE_ROLES } from "../../constants/finance";
import { idOf, titleCase, initials } from "../../utils/format";

const roleTone = (role) => (role === "owner" ? "brand" : role === "admin" ? "amber" : "gray");
const statusTone = (status) => (status === "active" ? "green" : status === "invited" ? "amber" : "gray");

export default function TeamTab() {
  const { workspaceId } = useWorkspace();
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listMembers(workspaceId);
      setMembers(res || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const invite = async () => {
    if (!email.trim() || !email.includes("@")) return toast.error("Enter a valid email.");
    setInviting(true);
    try {
      await inviteMember(workspaceId, email.trim(), role);
      toast.success("Invitation sent");
      setEmail("");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (member, newRole) => {
    try {
      await updateMemberRole(workspaceId, member.user?._id || member.user, newRole);
      toast.success("Role updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (member) => {
    try {
      await removeMember(workspaceId, member.user?._id || member.user);
      toast.success("Member removed");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Card title="Team members" sub="Invite people to collaborate on this workspace">
      <div className="field-row" style={{ marginBottom: 18 }}>
        <Field label="Invite by email">
          <Input placeholder="teammate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {WORKSPACE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Button variant="primary" size="sm" onClick={invite} disabled={inviting} style={{ marginBottom: 20 }}>
        {inviting ? <Spinner /> : <><Icon name="plus" size={13} /> Send invite</>}
      </Button>

      {loading ? (
        <div className="empty"><Spinner /></div>
      ) : !members.length ? (
        <div className="dim" style={{ padding: "20px 0", textAlign: "center" }}>No members yet.</div>
      ) : (
        <div>
          {members.map((m) => (
            <div className="list-item" key={idOf(m)}>
              <div className="avatar">{initials(m.user?.firstName, m.user?.lastName)}</div>
              <div style={{ flex: 1 }}>
                <div className="cell-strong">
                  {m.user?.firstName ? `${m.user.firstName} ${m.user.lastName || ""}`.trim() : m.user?.email}
                </div>
                <div className="dim" style={{ fontSize: 12 }}>{m.user?.email}</div>
              </div>
              {m.status === "invited" && (
                <Badge tone={statusTone(m.status)}>Invited</Badge>
              )}
              <Badge tone={roleTone(m.role)}>{titleCase(m.role)}</Badge>
              {m.role !== "owner" && (
                <div className="row">
                  <Select value={m.role} onChange={(e) => changeRole(m, e.target.value)} style={{ width: 110 }}>
                    {WORKSPACE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </Select>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
