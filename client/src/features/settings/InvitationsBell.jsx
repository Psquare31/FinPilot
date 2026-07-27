import { useEffect, useRef, useState } from "react";

import { Spinner } from "../../components/ui";
import { useToast } from "../../store/ToastContext";
import { useWorkspace } from "../../store/WorkspaceContext";
import {
  listPendingInvitations,
  acceptInvitation,
  declineInvitation,
} from "../../services/workspace.service";
import { idOf } from "../../utils/format";

export default function InvitationsBell() {
  const toast = useToast();
  const { retry } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const ref = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listPendingInvitations();
      setItems(res || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const accept = async (inv) => {
    const workspaceId = inv.workspace?._id || inv.workspace;
    setBusyId(idOf(inv));
    try {
      await acceptInvitation(workspaceId);
      toast.success(`Joined ${inv.workspace?.name || "workspace"}`);
      setItems((rows) => rows.filter((r) => idOf(r) !== idOf(inv)));
      retry?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (inv) => {
    const workspaceId = inv.workspace?._id || inv.workspace;
    setBusyId(idOf(inv));
    try {
      await declineInvitation(workspaceId);
      setItems((rows) => rows.filter((r) => idOf(r) !== idOf(inv)));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!loading && !items.length && !open) return null;

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen((o) => !o)} aria-label="Invitations">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
        {items.length > 0 && <span className="bell-dot">{items.length > 9 ? "9+" : items.length}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="between" style={{ marginBottom: 10 }}>
            <div className="card-title">Workspace invitations</div>
          </div>
          {loading ? (
            <div className="empty" style={{ padding: "20px 0" }}><Spinner /></div>
          ) : !items.length ? (
            <div className="dim" style={{ padding: "20px 0", textAlign: "center" }}>No pending invitations.</div>
          ) : (
            <div className="notif-list">
              {items.map((inv) => (
                <div key={idOf(inv)} className="notif-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong" style={{ fontSize: 13 }}>{inv.workspace?.name || "Workspace"}</div>
                    <div className="dim" style={{ fontSize: 12 }}>
                      Invited by {inv.invitedBy?.firstName ? `${inv.invitedBy.firstName} ${inv.invitedBy.lastName || ""}`.trim() : inv.invitedBy?.email || "a teammate"}
                    </div>
                    <div className="row" style={{ marginTop: 8, gap: 8 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={busyId === idOf(inv)}
                        onClick={() => accept(inv)}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-sm"
                        disabled={busyId === idOf(inv)}
                        onClick={() => decline(inv)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
