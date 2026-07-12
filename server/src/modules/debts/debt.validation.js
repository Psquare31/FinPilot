import { z } from "zod";

import {
    DEBT_TYPES,
    DEBT_STATUS,
    REPAYMENT_FREQUENCIES,
} from "../../constants/index.js";

import {
    objectId,
    moneySchema,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    sortOrderSchema,
} from "../../validators/common.validator.js";

// ======================================================
// Create Debt
// ======================================================

export const createDebtSchema = z.object({
    body: z
        .object({
            account: objectId.optional(),

            name: z
                .string({
                    required_error: "Debt name is required.",
                })
                .trim()
                .min(2, "Debt name must be at least 2 characters.")
                .max(100, "Debt name cannot exceed 100 characters."),

            lender: z
                .string({
                    required_error: "Lender name is required.",
                })
                .trim()
                .min(2, "Lender name must be at least 2 characters.")
                .max(100, "Lender name cannot exceed 100 characters."),

            type: z.enum(DEBT_TYPES),

            principalAmount: moneySchema,

            outstandingAmount: moneySchema,

            interestRate: z.coerce
                .number()
                .min(0, "Interest rate cannot be negative.")
                .max(100, "Interest rate cannot exceed 100%."),

            emiAmount: moneySchema,

            repaymentFrequency: z
                .enum(REPAYMENT_FREQUENCIES)
                .optional(),

            startDate: z.coerce.date(),

            endDate: z.coerce.date(),

            nextDueDate: z.coerce.date(),

            status: z
                .enum(DEBT_STATUS)
                .optional(),

            notes: z
                .string()
                .trim()
                .max(1000, "Notes cannot exceed 1000 characters.")
                .optional(),
        })
        .superRefine((data, ctx) => {

            if (data.endDate <= data.startDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endDate"],
                    message:
                        "End date must be after start date.",
                });
            }

            if (
                data.nextDueDate < data.startDate
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["nextDueDate"],
                    message:
                        "Next due date cannot be before the start date.",
                });
            }

            if (
                data.outstandingAmount.amount >
                data.principalAmount.amount
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["outstandingAmount"],
                    message:
                        "Outstanding amount cannot exceed the principal amount.",
                });
            }

        }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Update Debt
// ======================================================

export const updateDebtSchema = z.object({
    body: z
        .object({
            account: objectId.optional(),

            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            lender: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            type: z
                .enum(DEBT_TYPES)
                .optional(),

            principalAmount: moneySchema.optional(),

            outstandingAmount: moneySchema.optional(),

            interestRate: z.coerce
                .number()
                .min(0)
                .max(100)
                .optional(),

            emiAmount: moneySchema.optional(),

            repaymentFrequency: z
                .enum(REPAYMENT_FREQUENCIES)
                .optional(),

            startDate: z.coerce
                .date()
                .optional(),

            endDate: z.coerce
                .date()
                .optional(),

            nextDueDate: z.coerce
                .date()
                .optional(),

            status: z
                .enum(DEBT_STATUS)
                .optional(),

            notes: z
                .string()
                .trim()
                .max(1000)
                .optional(),
        })
        .refine(
            (data) => Object.keys(data).length > 0,
            {
                message:
                    "At least one field must be provided for update.",
            }
        ),

    params: z.object({
        debtId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Delete Debt
// ======================================================

export const deleteDebtSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        debtId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Debt
// ======================================================

export const getDebtSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        debtId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Debts
// ======================================================

export const getDebtsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(searchSchema)
        .merge(dateRangeSchema)
        .merge(sortOrderSchema)
        .extend({
            account: objectId.optional(),

            lender: z
                .string()
                .trim()
                .optional(),

            type: z
                .enum(DEBT_TYPES)
                .optional(),

            status: z
                .enum(DEBT_STATUS)
                .optional(),

            repaymentFrequency: z
                .enum(REPAYMENT_FREQUENCIES)
                .optional(),

            sortBy: z
                .enum([
                    "name",
                    "lender",
                    "startDate",
                    "endDate",
                    "nextDueDate",
                    "interestRate",
                    "createdAt",
                ])
                .default("createdAt"),
        }),
});
// ======================================================
// Record Payment
// ======================================================

export const paymentSchema = z.object({
    body: z.object({
        amount: z.coerce
            .number({ invalid_type_error: "Amount must be a number." })
            .positive("Payment amount must be greater than zero."),
    }),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});
