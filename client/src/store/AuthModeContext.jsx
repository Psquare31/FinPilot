import { createContext, useContext } from "react";

// Whether the API is running in DEMO_AUTH mode. Components need this to know
// if a ClerkProvider exists above them — Clerk components throw when it does
// not, so they must not be rendered at all in demo mode.
const AuthModeContext = createContext({ demoAuth: true });

export function AuthModeProvider({ demoAuth, children }) {
  return (
    <AuthModeContext.Provider value={{ demoAuth }}>
      {children}
    </AuthModeContext.Provider>
  );
}

export const useAuthMode = () => useContext(AuthModeContext);
