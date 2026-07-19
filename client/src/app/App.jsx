import { Routes, Route } from "react-router-dom";

import { ToastProvider } from "../store/ToastContext";
import { WorkspaceProvider, useWorkspace } from "../store/WorkspaceContext";
import { LoadingScreen, Button } from "../components/ui";

import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../features/dashboard/DashboardPage";
import TransactionsPage from "../features/transactions/TransactionsPage";
import BudgetsPage from "../features/budgets/BudgetsPage";
import GoalsPage from "../features/goals/GoalsPage";
import InvestmentsPage from "../features/investments/InvestmentsPage";

function Gate() {
  const { loading, error, retry } = useWorkspace();

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="center-screen">
        <div className="card" style={{ maxWidth: 420, textAlign: "center" }}>
          <div className="brand-logo" style={{ margin: "0 auto 14px" }}>
            !
          </div>
          <h3 style={{ marginBottom: 6 }}>Couldn't reach the API</h3>
          <p className="muted" style={{ marginBottom: 18 }}>{error}</p>
          <p className="dim" style={{ fontSize: 12, marginBottom: 18 }}>
            Make sure the FinPilot server is running on port 5000
            (<code>npm run dev</code> in <code>/server</code>).
          </p>
          <Button variant="primary" onClick={retry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <Gate />
      </WorkspaceProvider>
    </ToastProvider>
  );
}
