import { Router } from "express";

import {
  getDashboard,
  getAccountSummary,
  getTransactionSummary,
  getBudgetSummary,
  getGoalSummary,
  getDebtSummary,
  getInvestmentSummary,
  getRecentTransactions,
} from "../controllers/dashboard.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Dashboard
router.get("/", getDashboard);

// Dashboard Summaries
router.get("/accounts", getAccountSummary);

router.get("/transactions", getTransactionSummary);

router.get("/budgets", getBudgetSummary);

router.get("/goals", getGoalSummary);

router.get("/debts", getDebtSummary);

router.get("/investments", getInvestmentSummary);

router.get("/recent-transactions", getRecentTransactions);

export default router;