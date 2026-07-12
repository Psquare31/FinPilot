import { Router } from "express";

import healthRoutes from "./health.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import investmentTransactionRoutes from "./investmentTransaction.routes.js";

import authRoutes from "../modules/auth/index.js";
import userRoutes from "../modules/users/index.js";
import workspaceRoutes from "../modules/workspaces/index.js";
import accountRoutes from "../modules/accounts/index.js";
import categoryRoutes from "../modules/categories/index.js";
import transactionRoutes from "../modules/transactions/index.js";
import budgetRoutes from "../modules/budgets/index.js";
import goalRoutes from "../modules/goals/index.js";
import investmentRoutes from "../modules/investments/index.js";
import debtRoutes from "../modules/debts/index.js";
import analyticsRoutes from "../modules/analytics/index.js";
import reportRoutes from "../modules/reports/index.js";
import notificationRoutes from "../modules/notifications/index.js";
import aiRoutes from "../modules/ai/index.js";
import adminRoutes from "../modules/admin/index.js";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/accounts", accountRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/goals", goalRoutes);
router.use("/investments", investmentRoutes);
router.use("/investment-transactions", investmentTransactionRoutes);
router.use("/debts", debtRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/dashboard", analyticsRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/ai", aiRoutes);
router.use("/admin", adminRoutes);

export default router;
