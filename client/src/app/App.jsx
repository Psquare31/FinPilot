import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  useAuth,
} from "@clerk/clerk-react";

import { ToastProvider } from "../store/ToastContext";
import { WorkspaceProvider, useWorkspace } from "../store/WorkspaceContext";
import { AuthModeProvider } from "../store/AuthModeContext";
import { LoadingScreen, Button } from "../components/ui";
import { getRuntimeConfig } from "../services/config.service";
import { setTokenGetter } from "../services/apiClient";

import AppLayout from "../layouts/AppLayout";
import SignInScreen from "../features/auth/SignInScreen";
import DashboardPage from "../features/dashboard/DashboardPage";
import TransactionsPage from "../features/transactions/TransactionsPage";
import BudgetsPage from "../features/budgets/BudgetsPage";
import GoalsPage from "../features/goals/GoalsPage";
import InvestmentsPage from "../features/investments/InvestmentsPage";
import AiPage from "../features/ai/AiPage";
import SettingsPage from "../features/settings/SettingsPage";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ErrorScreen({ title, message, hint, onRetry }) {
  return (
    <div className="center-screen">
      <div className="card" style={{ maxWidth: 440, textAlign: "center" }}>
        <div className="brand-logo" style={{ margin: "0 auto 14px" }}>
          !
        </div>
        <h3 style={{ marginBottom: 6 }}>{title}</h3>
        <p className="muted" style={{ marginBottom: 18 }}>{message}</p>
        {hint && (
          <p className="dim" style={{ fontSize: 12, marginBottom: 18 }}>{hint}</p>
        )}
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { loading, error, retry } = useWorkspace();

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <ErrorScreen
        title="Couldn't load your data"
        message={error}
        hint="Make sure the FinPilot server is running on port 5000 (npm run dev in /server)."
        onRetry={retry}
      />
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
        <Route path="/assistant" element={<AiPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

const Workspace = () => (
  <WorkspaceProvider>
    <AppRoutes />
  </WorkspaceProvider>
);

// Registers Clerk's token getter with the API client, and only renders the app
// once it is in place — otherwise the first requests would race the token and
// come back 401.
function ClerkSession() {
  const { getToken, isLoaded } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    setTokenGetter(() => getToken());
    setReady(true);
  }, [isLoaded, getToken]);

  if (!ready) return <LoadingScreen label="Signing you in…" />;

  return <Workspace />;
}

export default function App() {
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(null);

  const loadConfig = () => {
    setConfigError(null);
    getRuntimeConfig()
      .then(setConfig)
      .catch((e) => setConfigError(e.message));
  };

  useEffect(loadConfig, []);

  if (configError) {
    return (
      <ToastProvider>
        <ErrorScreen
          title="Couldn't reach the API"
          message={configError}
          hint="Make sure the FinPilot server is running on port 5000 (npm run dev in /server)."
          onRetry={loadConfig}
        />
      </ToastProvider>
    );
  }

  if (!config) return <LoadingScreen />;

  // Demo mode: the API authenticates every request as a fixed user, so there
  // is no sign-in step at all.
  if (config.demoAuth) {
    return (
      <AuthModeProvider demoAuth>
        <ToastProvider>
          <Workspace />
        </ToastProvider>
      </AuthModeProvider>
    );
  }

  // Real auth, but the client has no Clerk key to talk to.
  if (!PUBLISHABLE_KEY) {
    return (
      <ToastProvider>
        <ErrorScreen
          title="Clerk key missing"
          message="The API requires sign-in, but this app has no Clerk publishable key."
          hint="Add VITE_CLERK_PUBLISHABLE_KEY to client/.env and restart the dev server — or set DEMO_AUTH=true in server/.env to skip sign-in."
        />
      </ToastProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AuthModeProvider demoAuth={false}>
        <ToastProvider>
          <SignedOut>
            <SignInScreen />
          </SignedOut>
          <SignedIn>
            <ClerkSession />
          </SignedIn>
        </ToastProvider>
      </AuthModeProvider>
    </ClerkProvider>
  );
}
