import { useEffect, useRef, useState } from "react";

import { Spinner } from "../../components/ui";
import { useToast } from "../../store/ToastContext";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notification.service";
import { idOf } from "../../utils/format";

export default function NotificationBell() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listNotifications({ read: "false", limit: 20 });
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

  const readOne = async (n) => {
    try {
      await markNotificationRead(idOf(n));
      setItems((rows) => rows.filter((r) => idOf(r) !== idOf(n)));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems([]);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {items.length > 0 && <span className="bell-dot">{items.length > 9 ? "9+" : items.length}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="between" style={{ marginBottom: 10 }}>
            <div className="card-title">Notifications</div>
            {items.length > 0 && (
              <button className="btn btn-sm" onClick={readAll}>
                Mark all read
              </button>
            )}
          </div>
          {loading ? (
            <div className="empty" style={{ padding: "20px 0" }}><Spinner /></div>
          ) : !items.length ? (
            <div className="dim" style={{ padding: "20px 0", textAlign: "center" }}>No new notifications.</div>
          ) : (
            <div className="notif-list">
              {items.map((n) => (
                <div key={idOf(n)} className="notif-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong" style={{ fontSize: 13 }}>{n.title}</div>
                    <div className="dim" style={{ fontSize: 12 }}>{n.message}</div>
                    <div className="row" style={{ marginTop: 8, gap: 8 }}>
                      <button className="btn btn-sm" onClick={() => readOne(n)}>
                        Mark read
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
