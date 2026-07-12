import { Router } from "express";

import {
  createInvestment,
  getInvestments,
  getInvestmentById,
  updateInvestment,
  archiveInvestment,
  restoreInvestment,
  deleteInvestment,
  buyInvestment,
  sellInvestment,
  updateCurrentPrice,
  getInvestmentSummary,
  getPortfolioAllocation,
} from "./investment.controller.js";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.js";

import {
  createInvestmentSchema,
  updateInvestmentSchema,
  investmentTradeSchema,
  updateCurrentPriceSchema,
} from "./investment.validation.js";

const router = Router();

router.use(requireAuth);

// Investments
router.post(
  "/",
  validate(createInvestmentSchema),
  createInvestment
);

router.get("/", getInvestments);

router.get("/summary", getInvestmentSummary);

router.get("/allocation", getPortfolioAllocation);

router.get("/:id", getInvestmentById);

router.patch(
  "/:id",
  validate(updateInvestmentSchema),
  updateInvestment
);

router.patch("/:id/archive", archiveInvestment);

router.patch("/:id/restore", restoreInvestment);

router.patch(
  "/:id/buy",
  validate(investmentTradeSchema),
  buyInvestment
);

router.patch(
  "/:id/sell",
  validate(investmentTradeSchema),
  sellInvestment
);

router.patch(
  "/:id/current-price",
  validate(updateCurrentPriceSchema),
  updateCurrentPrice
);

router.delete("/:id", deleteInvestment);

export default router;