import { Router } from "express";

import {
  getInvestmentTransactions,
  getInvestmentTransactionById,
  deleteInvestmentTransaction,
  getInvestmentHistory,
  getRecentTransactions,
  getActivitySummary,
} from "../controllers/investmentTransaction.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Investment Transactions
router.get("/", getInvestmentTransactions);

router.get("/summary", getActivitySummary);

router.get("/recent", getRecentTransactions);

router.get(
  "/investment/:investmentId",
  getInvestmentHistory
);

router.get("/:id", getInvestmentTransactionById);

router.delete("/:id", deleteInvestmentTransaction);

export default router;