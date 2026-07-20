import { SignIn } from "@clerk/clerk-react";

// Full-page sign-in shown when the API requires a real Clerk session.
export default function SignInScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-pitch">
        <div className="brand" style={{ padding: 0, marginBottom: 26 }}>
          <div className="brand-logo">₹</div>
          <div>
            <div className="brand-name">FinPilot</div>
            <div className="brand-sub">Finance Suite</div>
          </div>
        </div>
        <h2 className="auth-title">
          Your complete financial picture, in one place.
        </h2>
        <ul className="auth-list">
          <li>Track income, expenses and account balances in real time</li>
          <li>Set category budgets with overspend alerts</li>
          <li>Save toward goals and watch progress grow</li>
          <li>Monitor your investment portfolio and returns</li>
        </ul>
      </div>

      <div className="auth-form">
        <SignIn
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: "#6366f1",
              colorBackground: "#161c28",
              colorText: "#e8edf6",
              colorTextSecondary: "#9aa7bd",
              colorInputBackground: "#121722",
              colorInputText: "#e8edf6",
              borderRadius: "10px",
            },
          }}
        />
      </div>
    </div>
  );
}
