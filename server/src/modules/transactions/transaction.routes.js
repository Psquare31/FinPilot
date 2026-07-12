import { Router } from "express";

import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "./transaction.controller.js";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.js";

import {
  createTransactionSchema,
  updateTransactionSchema,
} from "./transaction.validation.js";

const router = Router();

router.use(requireAuth);

// Transactions
router.post(
  "/",
  validate(createTransactionSchema),
  createTransaction
);

router.get("/", getTransactions);

router.get("/:id", getTransactionById);

router.patch(
  "/:id",
  validate(updateTransactionSchema),
  updateTransaction
);

router.delete("/:id", deleteTransaction);

export default router;