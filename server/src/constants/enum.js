// =========================
// User
// =========================

export const USER_THEMES = ["light", "dark", "system"];

export const USER_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "JPY",
];

export const ACCOUNT_STATUS = [
  "active",
  "inactive",
  "suspended",
];

// =========================
// Workspace
// =========================

export const WORKSPACE_TYPES = [
  "personal",
  "family",
];

export const WORKSPACE_ROLES = [
  "owner",
  "admin",
  "member",
  "viewer",
];

export const WORKSPACE_STATUS = [
  "active",
  "archived",
];

export const WORKSPACE_COLORS = [
  "blue",
  "green",
  "purple",
  "red",
  "orange",
  "yellow",
  "pink",
  "teal",
];

export const MEMBER_STATUS = [
  "invited",
  "active",
  "suspended",
  "removed",
];

// =========================
// Accounts
// =========================

export const ACCOUNT_ICONS = [
  "wallet",
  "banknote",
  "building-2",
  "credit-card",
  "piggy-bank",
  "landmark",
];

export const ACCOUNT_TYPES = [
  "savings",
  "current",
  "cash",
  "credit_card",
  "upi",
  "wallet",
  "business",
];

export const ACCOUNT_COLORS = [
  "blue",
  "green",
  "purple",
  "red",
  "orange",
  "yellow",
  "pink",
  "gray",
];

// =========================
// Categories
// =========================

export const CATEGORY_TYPES = [
  "income",
  "expense",
];

// =========================
// Transactions
// =========================

export const TRANSACTION_TYPES = [
  "income",
  "expense",
  "transfer",
];

export const TRANSACTION_STATUS = [
  "pending",
  "completed",
  "cancelled",
];

export const RECURRENCE_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

// =========================
// Budgets
// =========================

export const BUDGET_PERIODS = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

// =========================
// Goals
// =========================

export const GOAL_TYPES = [
  "emergency",
  "vacation",
  "education",
  "purchase",
  "investment",
  "custom",
];

export const GOAL_STATUS = [
  "active",
  "completed",
  "cancelled",
];

// =========================
// Investments
// =========================

export const INVESTMENT_TYPES = [
  "stock",
  "mutual_fund",
  "crypto",
  "gold",
  "fd",
  "ppf",
  "nps",
];

export const RISK_LEVELS = [
  "low",
  "medium",
  "high",
];

// =========================
// Debt
// =========================

export const DEBT_TYPES = [
  "loan",
  "credit_card",
  "emi",
  "mortgage",
];

// =========================
// Reports
// =========================

export const REPORT_TYPES = [
  "monthly",
  "quarterly",
  "yearly",
  "budget",
  "investment",
];

// =========================
// Notifications
// =========================

export const NOTIFICATION_TYPES = [
  "budget",
  "goal",
  "transaction",
  "investment",
  "system",
];

export const NOTIFICATION_CHANNELS = [
  "in_app",
  "email",
];

// =========================
// Invitations
// =========================

export const INVITATION_STATUS = [
  "pending",
  "accepted",
  "rejected",
  "expired",
];

// =========================
// Audit Logs
// =========================

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "restore",
  "login",
  "logout",
];

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "upi",
  "credit_card",
  "debit_card",
  "wallet",
  "cheque",
  "other",
];

export const TRANSACTION_PRIORITIES = [
  "low",
  "medium",
  "high",
];

export const MERCHANT_TYPES = [
  "individual",
  "business",
  "government",
  "other",
];

export const INVESTMENT_TRANSACTION_TYPES = [
  "buy",
  "sell",
  "dividend",
  "bonus",
  "split",
  "interest",
];

export const INVESTMENT_TRANSACTION_STATUS = [
  "pending",
  "completed",
  "cancelled",
];

export const DEBT_STATUS = [
  "active",
  "closed",
  "defaulted",
];

export const REPAYMENT_FREQUENCIES = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

export const NOTIFICATION_STATUS = [
  "unread",
  "read",
];

export const NOTIFICATION_PRIORITIES = [
  "low",
  "medium",
  "high",
];

export const NOTIFICATION_CHANNELS = [
  "in_app",
  "email",
  "push",
];

export const INVITATION_STATUS = [
  "pending",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
];

export const REPORT_STATUS = [
  "pending",
  "generating",
  "completed",
  "failed",
];

export const REPORT_FORMATS = [
  "pdf",
  "csv",
  "xlsx",
];

export const REPORT_TYPES = [
  "monthly",
  "quarterly",
  "yearly",
  "budget",
  "investment",
  "cashflow",
  "networth",
  "custom",
];

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "restore",
  "archive",
  "login",
  "logout",
  "invite",
  "accept_invitation",
  "reject_invitation",
  "transfer",
  "export",
  "generate_report",
];

export const AUDIT_RESOURCES = [
  "user",
  "workspace",
  "workspace_member",
  "account",
  "transaction",
  "category",
  "budget",
  "goal",
  "investment",
  "investment_transaction",
  "debt",
  "notification",
  "report",
  "invitation",
];

export const AI_FEATURES = [
  "chat",
  "transaction_categorization",
  "budget_recommendation",
  "financial_insight",
  "receipt_analysis",
  "investment_analysis",
  "forecasting",
  "report_generation",
];

export const AI_INTERACTION_STATUS = [
  "success",
  "failed",
];