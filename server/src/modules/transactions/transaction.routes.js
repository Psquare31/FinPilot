import { Router } from "express";

import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  transferBetweenAccounts,
  duplicateTransaction,
  bulkCreateTransactions,
  bulkDeleteTransactions,
  getTransactionStatistics,
  getMonthlySummary,
  getCashFlow,
  getIncomeVsExpense,
  getSpendingByCategory,
  getSpendingByAccount,
  getRecentTransactions,
} from "./transaction.controller.js";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.js";

import {
  createTransactionSchema,
  updateTransactionSchema,
  transferTransactionSchema,
  bulkCreateTransactionsSchema,
  bulkDeleteTransactionsSchema,
} from "./transaction.validation.js";

const router = Router();

router.use(requireAuth);

// Analytics — declared before "/:id" so the literal paths win over the param.
router.get("/statistics", getTransactionStatistics);

router.get("/monthly-summary", getMonthlySummary);

router.get("/cash-flow", getCashFlow);

router.get("/income-vs-expense", getIncomeVsExpense);

router.get("/spending-by-category", getSpendingByCategory);

router.get("/spending-by-account", getSpendingByAccount);

router.get("/recent", getRecentTransactions);

// Transfers
router.post(
  "/transfer",
  validate(transferTransactionSchema),
  transferBetweenAccounts
);

// Bulk operations
router.post(
  "/bulk",
  validate(bulkCreateTransactionsSchema),
  bulkCreateTransactions
);

router.delete(
  "/bulk",
  validate(bulkDeleteTransactionsSchema),
  bulkDeleteTransactions
);

// Transactions
router.post(
  "/",
  validate(createTransactionSchema),
  createTransaction
);

router.get("/", getTransactions);

router.get("/:id", getTransactionById);

router.post("/:id/duplicate", duplicateTransaction);

router.patch(
  "/:id",
  validate(updateTransactionSchema),
  updateTransaction
);

router.delete("/:id", deleteTransaction);

export default router;
