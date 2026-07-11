import { Router } from "express";

import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import accountRoutes from "./account.routes.js";
import categoryRoutes from "./category.routes.js";
import transactionRoutes from "./transaction.routes.js";
import budgetRoutes from "./budget.routes.js";
import goalRoutes from "./goal.routes.js";
import debtRoutes from "./debt.routes.js";
import investmentRoutes from "./investment.routes.js";
import investmentTransactionRoutes from "./investmentTransaction.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import reportRoutes from "./report.routes.js";
import notificationRoutes from "./notification.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import auditLogRoutes from "./auditLog.routes.js";
import aiInteractionRoutes from "./ai.routes.js";

const router = Router();

// System
router.use("/", healthRoutes);

// Authentication
router.use("/auth", authRoutes);

// Workspace
router.use("/workspaces", workspaceRoutes);

// Finance
router.use("/accounts", accountRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/goals", goalRoutes);
router.use("/debts", debtRoutes);

// Investments
router.use("/investments", investmentRoutes);
router.use(
  "/investment-transactions",
  investmentTransactionRoutes
);

// Dashboard
router.use("/dashboard", dashboardRoutes);

// Reports
router.use("/reports", reportRoutes);

// Notifications
router.use("/notifications", notificationRoutes);

// Subscription
router.use("/subscriptions", subscriptionRoutes);

// Audit Logs
router.use("/audit-logs", auditLogRoutes);

// AI
router.use("/ai", aiInteractionRoutes);

export default router;