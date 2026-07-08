import { Router } from "express";

import {
  getLogs,
  getLogById,
  deleteLog,
  deleteOldLogs,
  getActivitySummary,
  getUserActivity,
  getResourceActivity,
} from "../controllers/audit.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Audit Logs
router.get("/", getLogs);

router.get("/summary", getActivitySummary);

router.get("/user/:userId", getUserActivity);

router.get(
  "/resource/:resource/:resourceId",
  getResourceActivity
);

router.get("/:id", getLogById);

router.delete("/cleanup", deleteOldLogs);

router.delete("/:id", deleteLog);

export default router;