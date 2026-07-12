import accountService from "./account.service.js";

import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// ======================================================
// Create Account
// ======================================================

const createAccount = asyncHandler(async (req, res) => {
    const account = await accountService.createAccount(
        req.user._id,
        req.validatedData?.body ?? req.body
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            account,
            "Account created successfully."
        )
    );
});

// ======================================================
// Get Accounts
// ======================================================

const getAccounts = asyncHandler(async (req, res) => {
    const { workspace } = req.query;

    const accounts = await accountService.getAccounts(
        workspace,
        req.user._id,
        req.query
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            accounts,
            "Accounts fetched successfully."
        )
    );
});

// ======================================================
// Get Account By Id
// ======================================================

const getAccountById = asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    const account = await accountService.getAccountById(
        accountId,
        req.user._id
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            account,
            "Account fetched successfully."
        )
    );
});

// ======================================================
// Update Account
// ======================================================

const updateAccount = asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    const account = await accountService.updateAccount(
        accountId,
        req.user._id,
        req.validatedData?.body ?? req.body
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            account,
            "Account updated successfully."
        )
    );
});

// ======================================================
// Archive Account
// ======================================================

const archiveAccount = asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    const account = await accountService.archiveAccount(
        accountId,
        req.user._id
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            account,
            "Account archived successfully."
        )
    );
});

// ======================================================
// Restore Account
// ======================================================

const restoreAccount = asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    const account = await accountService.restoreAccount(
        accountId,
        req.user._id
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            account,
            "Account restored successfully."
        )
    );
});

// ======================================================
// Delete Account
// ======================================================

const deleteAccount = asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    await accountService.permanentlyDeleteAccount(
        accountId,
        req.user._id
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Account deleted successfully."
        )
    );
});

// ======================================================
// Get Total Balance
// ======================================================

const getTotalBalance = asyncHandler(async (req, res) => {
    const { workspace } = req.query;

    const summary = await accountService.getTotalBalance(
        workspace,
        req.user._id
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            summary,
            "Account summary fetched successfully."
        )
    );
});

// ======================================================
// Adjust Balance
// ======================================================

const adjustBalance = asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    const { amount } =
        req.validatedData?.body ?? req.body;

    const account = await accountService.adjustBalance(
        accountId,
        amount,
        req.user._id
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            account,
            "Account balance updated successfully."
        )
    );
});

// ======================================================
// Reconcile Account
// ======================================================

const reconcileAccount = asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    const { balance } =
        req.validatedData?.body ?? req.body;

    const account =
        await accountService.reconcileAccount(
            accountId,
            balance,
            req.user._id
        );

    return res.status(200).json(
        new ApiResponse(
            200,
            account,
            "Account reconciled successfully."
        )
    );
});

export default {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    archiveAccount,
    restoreAccount,
    deleteAccount,
    getTotalBalance,
    adjustBalance,
    reconcileAccount,
};
