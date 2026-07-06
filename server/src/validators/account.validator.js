import { z } from "zod";
import {
    ACCOUNT_TYPES,
    ACCOUNT_COLORS,
    ACCOUNT_ICONS,
    USER_CURRENCIES,
} from "../constants/index.js";
import { objectId } from "./common.validator.js";

// ==============================
// Create Account
// ==============================

export const createAccountSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(2, "Account name must be at least 2 characters.")
            .max(100, "Account name must be at most 100 characters."),

        type: z.enum(ACCOUNT_TYPES, {
            errorMap: () => ({ message: "Invalid account type." }),
        }),

        currency: z
            .string()
            .trim()
            .toUpperCase()
            .pipe(
                z.enum(USER_CURRENCIES, {
                    errorMap: () => ({ message: "Invalid currency." }),
                })
            ),

        initialBalance: z.coerce
            .number()
            .finite("Initial balance must be a valid number."),

        color: z
            .enum(ACCOUNT_COLORS, {
                errorMap: () => ({ message: "Invalid account color." }),
            })
            .optional(),

        icon: z
            .enum(ACCOUNT_ICONS, {
                errorMap: () => ({ message: "Invalid account icon." }),
            })
            .optional(),
    }),

    params: z.object({}),

    query: z.object({}),
});

// ==============================
// Update Account
// ==============================

export const updateAccountSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2, "Account name must be at least 2 characters.")
                .max(100, "Account name must be at most 100 characters.")
                .optional(),

            type: z
                .enum(ACCOUNT_TYPES, {
                    errorMap: () => ({ message: "Invalid account type." }),
                })
                .optional(),

            currency: z
                .string()
                .trim()
                .toUpperCase()
                .pipe(
                    z.enum(USER_CURRENCIES, {
                        errorMap: () => ({
                            message: "Invalid currency.",
                        }),
                    })
                )
                .optional(),

            color: z
                .enum(ACCOUNT_COLORS, {
                    errorMap: () => ({ message: "Invalid account color." }),
                })
                .optional(),

            icon: z
                .enum(ACCOUNT_ICONS, {
                    errorMap: () => ({ message: "Invalid account icon." }),
                })
                .optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field must be provided for update.",
        }),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ==============================
// Delete Account
// ==============================

export const deleteAccountSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ==============================
// Get Single Account
// ==============================

export const getAccountSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ==============================
// Get All Accounts
// ==============================

export const getAccountsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().trim().optional(),
        type: z.enum(ACCOUNT_TYPES).optional(),
        currency: z.enum(USER_CURRENCIES).optional(),
    }),
});