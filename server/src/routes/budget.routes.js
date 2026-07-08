import { Router } from "express";

import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  archiveBudget,
  restoreBudget,
  deleteBudget,
  getBudgetProgress,
  getBudgetOverview,
} from "../controllers/budget.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createBudgetSchema,
  updateBudgetSchema,
} from "../validators/budget.validator.js";

const router = Router();

router.use(requireAuth);

// Budgets
router.post(
  "/",
  validate(createBudgetSchema),
  createBudget
);

router.get("/", getBudgets);

router.get("/overview", getBudgetOverview);

router.get("/:id", getBudgetById);

router.get("/:id/progress", getBudgetProgress);

router.patch(
  "/:id",
  validate(updateBudgetSchema),
  updateBudget
);

router.patch("/:id/archive", archiveBudget);

router.patch("/:id/restore", restoreBudget);

router.delete("/:id", deleteBudget);

export default router;