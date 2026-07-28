import { NavLink, Outlet } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

import { Icon } from "../components/ui";
import { useWorkspace } from "../store/WorkspaceContext";
import { useAuthMode } from "../store/AuthModeContext";
import { initials } from "../utils/format";
import NotificationBell from "../features/notifications/NotificationBell";
import InvitationsBell from "../features/settings/InvitationsBell";

// UserButton requires a ClerkProvider above it, which only exists when the API
// is running the real Clerk flow. In demo mode render a plain avatar instead.
function AccountMenu({ user }) {
  const { demoAuth } = useAuthMode();

  if (demoAuth) {
    return <div className="avatar">{initials(user?.firstName, user?.lastName)}</div>;
  }

  return (
    <UserButton
      appearance={{
        variables: { colorBackground: "#161c28", colorText: "#e8edf6" },
        elements: { avatarBox: { width: 34, height: 34 } },
      }}
    />
  );
}

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/transactions", label: "Transactions", icon: "transactions" },
  { to: "/budgets", label: "Budgets", icon: "budgets" },
  { to: "/goals", label: "Goals", icon: "goals" },
  { to: "/investments", label: "Investments", icon: "investments" },
  { to: "/assistant", label: "AI Assistant", icon: "sparkle" },
  { to: "/settings", label: "Settings", icon: "settings" },
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
            <NotificationBell />
            <InvitationsBell />
            <AccountMenu user={user} />
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
