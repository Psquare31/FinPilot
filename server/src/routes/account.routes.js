import { Router } from "express";

import accountController from "../controllers/account.controller.js";

import requireAuth from "../middlewares/authenticate.js";
import validate from "../middlewares/validate.js";

import {
    createAccountSchema,
    updateAccountSchema,
    getAccountSchema,
    deleteAccountSchema,
    getAccountsSchema,
    archiveAccountSchema,
    restoreAccountSchema,
    adjustBalanceSchema,
    reconcileAccountSchema,
} from "../validators/account.validator.js";

const router = Router();

router.use(requireAuth);

// ======================================================
// Accounts
// ======================================================

router
    .route("/")
    .get(
        validate(getAccountsSchema),
        accountController.getAccounts
    )
    .post(
        validate(createAccountSchema),
        accountController.createAccount
    );

// ======================================================
// Summary
// ======================================================

router.get(
    "/summary",
    validate(getAccountsSchema),
    accountController.getTotalBalance
);

// ======================================================
// Account
// ======================================================

router
    .route("/:accountId")
    .get(
        validate(getAccountSchema),
        accountController.getAccountById
    )
    .patch(
        validate(updateAccountSchema),
        accountController.updateAccount
    )
    .delete(
        validate(deleteAccountSchema),
        accountController.deleteAccount
    );

// ======================================================
// Archive
// ======================================================

router.patch(
    "/:accountId/archive",
    validate(archiveAccountSchema),
    accountController.archiveAccount
);

// ======================================================
// Restore
// ======================================================

router.patch(
    "/:accountId/restore",
    validate(restoreAccountSchema),
    accountController.restoreAccount
);

// ======================================================
// Balance
// ======================================================

router.patch(
    "/:accountId/adjust-balance",
    validate(adjustBalanceSchema),
    accountController.adjustBalance
);

router.patch(
    "/:accountId/reconcile",
    validate(reconcileAccountSchema),
    accountController.reconcileAccount
);

export default router;