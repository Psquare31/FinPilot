// Mirrors the backend enums (server/src/constants) plus display metadata
// for the UI: labels, colors and emoji icons.

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY"];

// Excludes "owner" — ownership is granted via transferOwnership, not the
// invite/role-change dropdowns.
export const WORKSPACE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

export const ACCOUNT_TYPES = [
  { value: "savings", label: "Savings", icon: "🏦" },
  { value: "current", label: "Current", icon: "💼" },
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "credit_card", label: "Credit Card", icon: "💳" },
  { value: "upi", label: "UPI", icon: "📲" },
  { value: "wallet", label: "Wallet", icon: "👛" },
  { value: "business", label: "Business", icon: "🏢" },
];

export const PAYMENT_METHODS = [
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "wallet", label: "Wallet" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export const BUDGET_PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export const GOAL_TYPES = [
  { value: "emergency", label: "Emergency Fund", icon: "🛟" },
  { value: "vacation", label: "Vacation", icon: "🏝️" },
  { value: "education", label: "Education", icon: "🎓" },
  { value: "purchase", label: "Big Purchase", icon: "🛍️" },
  { value: "investment", label: "Investment", icon: "📈" },
  { value: "custom", label: "Custom", icon: "🎯" },
];

export const INVESTMENT_TYPES = [
  { value: "stock", label: "Stock", icon: "📊" },
  { value: "mutual_fund", label: "Mutual Fund", icon: "🧺" },
  { value: "crypto", label: "Crypto", icon: "🪙" },
  { value: "gold", label: "Gold", icon: "🥇" },
  { value: "fd", label: "Fixed Deposit", icon: "🏦" },
  { value: "ppf", label: "PPF", icon: "🛡️" },
  { value: "nps", label: "NPS", icon: "🧓" },
];

export const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

// Categories seeded on first run for a fresh workspace.
export const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income", color: "#22c55e", icon: "briefcase" },
  { name: "Freelance", type: "income", color: "#10b981", icon: "laptop" },
  { name: "Investments Returns", type: "income", color: "#14b8a6", icon: "trending-up" },
  { name: "Food & Dining", type: "expense", color: "#f97316", icon: "utensils" },
  { name: "Rent & Housing", type: "expense", color: "#6366f1", icon: "home" },
  { name: "Transport", type: "expense", color: "#38bdf8", icon: "car" },
  { name: "Shopping", type: "expense", color: "#ec4899", icon: "shopping-bag" },
  { name: "Entertainment", type: "expense", color: "#a855f7", icon: "film" },
  { name: "Utilities & Bills", type: "expense", color: "#f59e0b", icon: "zap" },
  { name: "Health", type: "expense", color: "#f43f5e", icon: "heart" },
];

// Emoji shown for a category based on its name (best-effort, cosmetic).
export const categoryEmoji = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("salary") || n.includes("income")) return "💰";
  if (n.includes("freelance")) return "💻";
  if (n.includes("invest")) return "📈";
  if (n.includes("food") || n.includes("dining")) return "🍽️";
  if (n.includes("rent") || n.includes("hous")) return "🏠";
  if (n.includes("transport") || n.includes("car") || n.includes("fuel")) return "🚗";
  if (n.includes("shop")) return "🛍️";
  if (n.includes("entertain")) return "🎬";
  if (n.includes("util") || n.includes("bill")) return "💡";
  if (n.includes("health") || n.includes("medic")) return "❤️";
  if (n.includes("travel") || n.includes("vacation")) return "✈️";
  if (n.includes("edu")) return "🎓";
  return "🏷️";
};

// A stable palette for charts / category dots.
export const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#38bdf8",
  "#ec4899",
  "#a855f7",
  "#f59e0b",
  "#14b8a6",
  "#f43f5e",
  "#84cc16",
];
