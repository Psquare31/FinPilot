import { Router } from "express";

import {
  createReport,
  getReports,
  getReportById,
  deleteReport,
  generateMonthlyReport,
  generateNetWorthReport,
  generateCashFlowReport,
  generateInvestmentReport,
} from "./report.controller.js";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.js";

import {
  generateReportSchema,
} from "./report.validation.js";

const router = Router();

router.use(requireAuth);

// Reports
router.post(
  "/",
  validate(generateReportSchema),
  createReport
);

router.get("/", getReports);

router.get("/monthly", generateMonthlyReport);

router.get("/net-worth", generateNetWorthReport);

router.get("/cash-flow", generateCashFlowReport);

router.get("/investments", generateInvestmentReport);

router.get("/:id", getReportById);

router.delete("/:id", deleteReport);

export default router;