import { z } from "zod";

import {
    ACCOUNT_TYPES,
    ACCOUNT_COLORS,
    ACCOUNT_ICONS,
    USER_CURRENCIES,
} from "../constants/index.js";

import {
    objectId,
    paginationSchema,
    searchSchema,
    sortOrderSchema,
} from "./common.validator.js";

// ======================================================
// Create Account
// ======================================================

export const createAccountSchema = z.object({
    body: z
        .object({
            workspace: objectId,

            name: z
                .string()
                .trim()
                .min(2, "Account name must be at least 2 characters.")
                .max(100, "Account name cannot exceed 100 characters."),

            type: z.enum(ACCOUNT_TYPES),

            institution: z
                .string()
                .trim()
                .max(100)
                .optional(),

            accountNumber: z
                .string()
                .trim()
                .max(30)
                .optional(),

            openingBalance: z
                .coerce
                .number()
                .finite()
                .default(0),

            currency: z
                .string()
                .trim()
                .toUpperCase()
                .pipe(z.enum(USER_CURRENCIES)),

            color: z
                .enum(ACCOUNT_COLORS)
                .optional(),

            icon: z
                .enum(ACCOUNT_ICONS)
                .optional(),

            notes: z
                .string()
                .trim()
                .max(500)
                .optional(),
        })
        .strict(),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Update Account
// ======================================================

export const updateAccountSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            institution: z
                .string()
                .trim()
                .max(100)
                .optional(),

            accountNumber: z
                .string()
                .trim()
                .max(30)
                .optional(),

            type: z
                .enum(ACCOUNT_TYPES)
                .optional(),

            currency: z
                .string()
                .trim()
                .toUpperCase()
                .pipe(
                    z.enum(USER_CURRENCIES)
                )
                .optional(),

            color: z
                .enum(ACCOUNT_COLORS)
                .optional(),

            icon: z
                .enum(ACCOUNT_ICONS)
                .optional(),

            notes: z
                .string()
                .trim()
                .max(500)
                .optional(),
        })
        .strict()
        .refine(
            (data) =>
                Object.keys(data).length > 0,
            {
                message:
                    "At least one field must be provided.",
            }
        ),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Account
// ======================================================

export const getAccountSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Delete Account
// ======================================================

export const deleteAccountSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Accounts
// ======================================================

export const getAccountsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(searchSchema)
        .merge(sortOrderSchema)
        .extend({
            workspace: objectId,

            type: z
                .enum(ACCOUNT_TYPES)
                .optional(),

            currency: z
                .enum(USER_CURRENCIES)
                .optional(),

            isArchived: z
                .coerce
                .boolean()
                .optional(),

            sortBy: z
                .enum([
                    "name",
                    "balance",
                    "createdAt",
                    "updatedAt",
                ])
                .default("createdAt"),
        }),
});

// ======================================================
// Archive Account
// ======================================================

export const archiveAccountSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Restore Account
// ======================================================

export const restoreAccountSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Adjust Balance
// ======================================================

export const adjustBalanceSchema = z.object({
    body: z
        .object({
            amount: z
                .coerce
                .number()
                .finite("Amount must be a valid number."),
        })
        .strict(),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Reconcile Account
// ======================================================

export const reconcileAccountSchema = z.object({
    body: z
        .object({
            balance: z
                .coerce
                .number()
                .min(0, "Balance cannot be negative."),
        })
        .strict(),

    params: z.object({
        accountId: objectId,
    }),

    query: z.object({}),
});