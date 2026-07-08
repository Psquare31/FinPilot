import { Router } from "express";

import {
  createDebt,
  getDebts,
  getDebtById,
  updateDebt,
  archiveDebt,
  restoreDebt,
  deleteDebt,
  recordPayment,
  getDebtProgress,
  getDebtSummary,
  getUpcomingPayments,
} from "../controllers/debt.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createDebtSchema,
  updateDebtSchema,
  paymentSchema,
} from "../validators/debt.validator.js";

const router = Router();

router.use(requireAuth);

// Debts
router.post(
  "/",
  validate(createDebtSchema),
  createDebt
);

router.get("/", getDebts);

router.get("/summary", getDebtSummary);

router.get("/upcoming-payments", getUpcomingPayments);

router.get("/:id", getDebtById);

router.get("/:id/progress", getDebtProgress);

router.patch(
  "/:id",
  validate(updateDebtSchema),
  updateDebt
);

router.patch("/:id/archive", archiveDebt);

router.patch("/:id/restore", restoreDebt);

router.patch(
  "/:id/payment",
  validate(paymentSchema),
  recordPayment
);

router.delete("/:id", deleteDebt);

export default router;