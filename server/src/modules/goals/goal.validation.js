import { z } from "zod";

import {
    GOAL_TYPES,
    GOAL_STATUS,

} from "../../constants/index.js";

import {
    objectId,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    sortOrderSchema,
    moneySchema,
} from "../../validators/common.validator.js";

// ======================================================
// Auto Save Schema
// ======================================================

const autoSaveSchema = z.object({
    enabled: z.boolean().optional(),

    amount: z.coerce
        .number({
            invalid_type_error: "Auto save amount must be a number.",
        })
        .min(0, "Auto save amount cannot be negative.")
        .optional(),
});

// ======================================================
// Create Goal
// ======================================================

export const createGoalSchema = z.object({
    body: z
        .object({
            linkedAccount: objectId.optional(),

            name: z
                .string({
                    required_error: "Goal name is required.",
                })
                .trim()
                .min(2, "Goal name must be at least 2 characters.")
                .max(100, "Goal name cannot exceed 100 characters."),

            description: z
                .string()
                .trim()
                .max(500)
                .optional(),

            type: z.enum(GOAL_TYPES),

            targetAmount: moneySchema,

            currentAmount: moneySchema.optional(),

            targetDate: z.coerce.date(),

            status: z
                .enum(GOAL_STATUS)
                .optional(),

            priority: z.coerce
                .number()
                .int()
                .min(1, "Priority must be between 1 and 5.")
                .max(5, "Priority must be between 1 and 5.")
                .optional(),

            autoSave: autoSaveSchema.optional(),
        })
        .superRefine((data, ctx) => {

            if (data.targetDate <= new Date()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["targetDate"],
                    message:
                        "Target date must be in the future.",
                });
            }

            if (
                data.currentAmount &&
                data.currentAmount.amount >
                    data.targetAmount.amount
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["currentAmount"],
                    message:
                        "Current amount cannot exceed target amount.",
                });
            }

        }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Update Goal
// ======================================================

export const updateGoalSchema = z.object({
    body: z
        .object({
            linkedAccount: objectId.optional(),

            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            description: z
                .string()
                .trim()
                .max(500)
                .optional(),

            type: z
                .enum(GOAL_TYPES)
                .optional(),

            targetAmount: moneySchema.optional(),

            currentAmount: moneySchema.optional(),

            targetDate: z.coerce
                .date()
                .optional(),

            status: z
                .enum(GOAL_STATUS)
                .optional(),

            priority: z.coerce
                .number()
                .int()
                .min(1)
                .max(5)
                .optional(),

            autoSave: autoSaveSchema.optional(),
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
                data.targetAmount &&
                data.currentAmount &&
                data.currentAmount.amount >
                    data.targetAmount.amount
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["currentAmount"],
                    message:
                        "Current amount cannot exceed target amount.",
                });
            }

        }),

    params: z.object({
        goalId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Delete Goal
// ======================================================

export const deleteGoalSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        goalId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Goal
// ======================================================

export const getGoalSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        goalId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Goals
// ======================================================

export const getGoalsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(searchSchema)
        .merge(dateRangeSchema)
        .merge(sortOrderSchema)
        .extend({
            linkedAccount: objectId.optional(),

            type: z.enum(GOAL_TYPES).optional(),

            status: z.enum(GOAL_STATUS).optional(),

            priority: z.coerce
                .number()
                .min(1)
                .max(5)
                .optional(),

            sortBy: z
                .enum([
                    "name",
                    "priority",
                    "targetDate",
                    "createdAt",
                    "targetAmount.amount",
                ])
                .default("createdAt"),
        }),
});
// ======================================================
// Contribution (add / withdraw)
// ======================================================

export const contributionSchema = z.object({
    body: z.object({
        amount: z.coerce
            .number({ invalid_type_error: "Amount must be a number." })
            .positive("Amount must be greater than zero."),
    }),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});
