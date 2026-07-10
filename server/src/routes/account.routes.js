import { Router } from "express";

import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  archiveAccount,
  restoreAccount,
  deleteAccount,
  getTotalBalance,
} from "../controllers/account.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createAccountSchema,
  updateAccountSchema,
} from "../validators/account.validator.js";

const router = Router();

// Authentication middleware 
router.use(requireAuth);

// Accounts
router
  .route("/")
  .get(getAccounts)
  .post(
    validate(createAccountSchema),
    createAccount
  );

// Total Balance
router.get(
  "/summary",
  getTotalBalance
);

// Account by ID
router
  .route("/:id")
  .get(getAccountById)
  .patch(
    validate(updateAccountSchema),
    updateAccount
  )
  .delete(deleteAccount);

// Archive Account
router.patch(
  "/:id/archive",
  archiveAccount
);

// Restore Account
router.patch(
  "/:id/restore",
  restoreAccount
);

export default router;