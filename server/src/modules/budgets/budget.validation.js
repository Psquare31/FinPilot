import { z } from "zod";

import {
    BUDGET_PERIODS,
    USER_CURRENCIES,
} from "../../constants/index.js";

import {
    objectId,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    dateRangeRefinement,
    sortOrderSchema,
} from "../../validators/common.validator.js";

// ======================================================
// Shared Money Schema
// ======================================================

const moneySchema = z.object({
    amount: z.coerce
        .number({
            invalid_type_error: "Amount must be a number.",
        })
        .positive("Amount must be greater than zero."),

    currency: z
        .string()
        .trim()
        .toUpperCase()
        .pipe(z.enum(USER_CURRENCIES)),
});

// ======================================================
// Create Budget
// ======================================================

export const createBudgetSchema = z.object({
    body: z
        .object({
            category: objectId,

            name: z
                .string()
                .trim()
                .min(2, "Budget name must be at least 2 characters.")
                .max(100, "Budget name cannot exceed 100 characters."),

            period: z.enum(BUDGET_PERIODS),

            budgetAmount: moneySchema,

            startDate: z.coerce.date(),

            endDate: z.coerce.date(),

            rollover: z.boolean().optional(),

            alertThreshold: z.coerce
                .number()
                .min(1, "Alert threshold must be at least 1%.")
                .max(100, "Alert threshold cannot exceed 100%.")
                .optional(),

            isActive: z.boolean().optional(),
        })
        .superRefine((data, ctx) => {
            if (data.startDate >= data.endDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endDate"],
                    message:
                        "End date must be after start date.",
                });
            }
        }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Update Budget
// ======================================================

export const updateBudgetSchema = z.object({
    body: z
        .object({
            category: objectId.optional(),

            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            period: z
                .enum(BUDGET_PERIODS)
                .optional(),

            budgetAmount: moneySchema.optional(),

            startDate: z.coerce
                .date()
                .optional(),

            endDate: z.coerce
                .date()
                .optional(),

            rollover: z
                .boolean()
                .optional(),

            alertThreshold: z.coerce
                .number()
                .min(1)
                .max(100)
                .optional(),

            isActive: z
                .boolean()
                .optional(),
        })
        .refine(
            (data) => Object.keys(data).length > 0,
            {
                message:
                    "At least one field must be provided for update.",
            }
        )
        .superRefine((data, ctx) => {
            if (
                data.startDate &&
                data.endDate &&
                data.startDate >= data.endDate
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endDate"],
                    message:
                        "End date must be after start date.",
                });
            }
        }),

    params: z.object({
        budgetId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Delete Budget
// ======================================================

export const deleteBudgetSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        budgetId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Budget
// ======================================================

export const getBudgetSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        budgetId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Budgets
// ======================================================

export const getBudgetsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(searchSchema)
        .merge(dateRangeSchema)
        .merge(sortOrderSchema)
        .extend({
            period: z
                .enum(BUDGET_PERIODS)
                .optional(),

            category: objectId.optional(),

            isActive: z.coerce
                .boolean()
                .optional(),

            sortBy: z
                .enum([
                    "name",
                    "startDate",
                    "endDate",
                    "createdAt",
                    "budgetAmount.amount",
                ])
                .default("createdAt"),
        })
        .superRefine(dateRangeRefinement),
});