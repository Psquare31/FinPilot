import { useEffect } from "react";

/* ---------------- Icons (inline stroke SVGs) ---------------- */

const PATHS = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  transactions:
    "M7 17l-4-4 4-4M3 13h13M17 7l4 4-4 4M21 11H8",
  budgets: "M3 3v18h18M7 15l4-4 3 3 5-6",
  goals:
    "M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a5 5 0 100 10 5 5 0 000-10zm0 3a2 2 0 110 4 2 2 0 010-4z",
  investments: "M3 17l6-6 4 4 8-8M17 7h4v4",
  wallet:
    "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm14 4h.01M3 9h18",
  plus: "M12 5v14M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
  trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowDown: "M12 5v14M19 12l-7 7-7-7",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  check: "M20 6L9 17l-5-5",
  calendar: "M3 4h18v18H3zM3 10h18M8 2v4M16 2v4",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
};

export function Icon({ name, size = 18, className = "", strokeWidth = 2 }) {
  const d = PATHS[name] || PATHS.dashboard;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/* ---------------- Button ---------------- */

export function Button({ variant = "", size = "", children, ...rest }) {
  const cls = ["btn", variant && `btn-${variant}`, size && `btn-${size}`]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function Card({ title, sub, action, children, className = "", ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <div className="card-title">{title}</div>}
            {sub && <div className="card-sub">{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* ---------------- Stat card ---------------- */

export function StatCard({ label, value, icon, iconBg, delta, deltaDir }) {
  return (
    <div className="card stat">
      <div className="between">
        <span className="stat-label">{label}</span>
        {icon && (
          <span className="stat-ic" style={{ background: iconBg || "var(--brand-soft)" }}>
            {icon}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {delta && (
        <div className={`stat-delta ${deltaDir === "down" ? "down" : "up"}`}>
          <Icon name={deltaDir === "down" ? "arrowDown" : "arrowUp"} size={13} />
          {delta}
        </div>
      )}
    </div>
  );
}

/* ---------------- Badge ---------------- */

export function Badge({ tone = "gray", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/* ---------------- Progress bar ---------------- */

export function ProgressBar({ value = 0, color = "var(--brand)" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="bar">
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({ title, sub, onClose, children, footer, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="modal"
        style={wide ? { maxWidth: 560 } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h3 style={{ fontSize: 17 }}>{title}</h3>
            {sub && <div className="card-sub" style={{ marginTop: 3 }}>{sub}</div>}
          </div>
          <button className="x-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Form fields ---------------- */

export function Field({ label, children, hint }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="dim" style={{ fontSize: 11.5 }}>{hint}</span>}
    </div>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Textarea(props) {
  return <textarea className="input" rows={3} {...props} />;
}

export function Select({ children, ...rest }) {
  return (
    <select className="select" {...rest}>
      {children}
    </select>
  );
}

/* ---------------- Empty state ---------------- */

export function EmptyState({ icon = "wallet", title, hint, action }) {
  return (
    <div className="empty">
      <div className="em-ic">
        <Icon name={icon} size={24} />
      </div>
      <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {hint && <div style={{ maxWidth: 340, margin: "0 auto 16px" }}>{hint}</div>}
      {action}
    </div>
  );
}

/* ---------------- Loading ---------------- */

export function Spinner() {
  return <div className="spinner" />;
}

export function LoadingScreen({ label = "Loading FinPilot…" }) {
  return (
    <div className="center-screen">
      <div style={{ textAlign: "center" }}>
        <div
          className="brand-logo"
          style={{ width: 54, height: 54, margin: "0 auto 16px", fontSize: 24 }}
        >
          ₹
        </div>
        <div className="row" style={{ justifyContent: "center", color: "var(--text-muted)" }}>
          <Spinner />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}
