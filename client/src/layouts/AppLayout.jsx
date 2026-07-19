import { NavLink, Outlet } from "react-router-dom";

import { Icon } from "../components/ui";
import { useWorkspace } from "../store/WorkspaceContext";
import { initials } from "../utils/format";

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/transactions", label: "Transactions", icon: "transactions" },
  { to: "/budgets", label: "Budgets", icon: "budgets" },
  { to: "/goals", label: "Goals", icon: "goals" },
  { to: "/investments", label: "Investments", icon: "investments" },
];

export default function AppLayout() {
  const { user, workspace } = useWorkspace();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">₹</div>
          <div>
            <div className="brand-name">FinPilot</div>
            <div className="brand-sub">Finance Suite</div>
          </div>
        </div>

        <div className="nav-label">Menu</div>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon name={n.icon} className="ic" />
            {n.label}
          </NavLink>
        ))}

        <div className="sidebar-foot">
          <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
            Live demo mode
          </div>
          Every action writes to the real MongoDB-backed API.
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{workspace?.name || "Workspace"}</h1>
            <div className="topbar-sub">Personal finance & investment analytics</div>
          </div>
          <div className="topbar-right">
            <div className="ws-pill">
              <span className="ws-dot" />
              API connected
            </div>
            <div className="avatar">{initials(user?.firstName, user?.lastName)}</div>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
