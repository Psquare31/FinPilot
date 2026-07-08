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
} from "../controllers/report.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createReportSchema,
} from "../validators/report.validator.js";

const router = Router();

router.use(requireAuth);

// Reports
router.post(
  "/",
  validate(createReportSchema),
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