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

import requireAuth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createAccountSchema,
  updateAccountSchema,
} from "../validators/account.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/
router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| Accounts
|--------------------------------------------------------------------------
|
| POST   /accounts
| GET    /accounts?workspace=<workspaceId>
|
*/
router
  .route("/")
  .get(getAccounts)
  .post(
    validate(createAccountSchema),
    createAccount
  );

/*
|--------------------------------------------------------------------------
| Summary
|--------------------------------------------------------------------------
|
| GET /accounts/summary?workspace=<workspaceId>
|
*/
router.get(
  "/summary",
  getTotalBalance
);

/*
|--------------------------------------------------------------------------
| Single Account
|--------------------------------------------------------------------------
|
| GET    /accounts/:id
| PATCH  /accounts/:id
| DELETE /accounts/:id
|
*/
router
  .route("/:id")
  .get(getAccountById)
  .patch(
    validate(updateAccountSchema),
    updateAccount
  )
  .delete(deleteAccount);

/*
|--------------------------------------------------------------------------
| Archive
|--------------------------------------------------------------------------
|
| PATCH /accounts/:id/archive
|
*/
router.patch(
  "/:id/archive",
  archiveAccount
);

/*
|--------------------------------------------------------------------------
| Restore
|--------------------------------------------------------------------------
|
| PATCH /accounts/:id/restore
|
*/
router.patch(
  "/:id/restore",
  restoreAccount
);

export default router;