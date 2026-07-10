import { Router } from "express";

import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  archiveGoal,
  restoreGoal,
  deleteGoal,
  addContribution,
  withdrawContribution,
  getGoalProgress,
  getGoalSummary,
} from "../controllers/goal.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createGoalSchema,
  updateGoalSchema,
  contributionSchema,
} from "../validators/goal.validator.js";

const router = Router();

router.use(requireAuth);

// Goals
router.post(
  "/",
  validate(createGoalSchema),
  createGoal
);

router.get("/", getGoals);

router.get("/summary", getGoalSummary);

router.get("/:id", getGoalById);

router.get("/:id/progress", getGoalProgress);

router.patch(
  "/:id",
  validate(updateGoalSchema),
  updateGoal
);

router.patch("/:id/archive", archiveGoal);

router.patch("/:id/restore", restoreGoal);

router.patch(
  "/:id/contribute",
  validate(contributionSchema),
  addContribution
);

router.patch(
  "/:id/withdraw",
  validate(contributionSchema),
  withdrawContribution
);

router.delete("/:id", deleteGoal);

export default router;4