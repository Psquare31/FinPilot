import { z } from "zod";

import {
    INVESTMENT_TYPES,
    RISK_LEVELS,
} from "../../constants/index.js";

import {
    objectId,
    moneySchema,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    dateRangeRefinement,
    sortOrderSchema,
} from "../../validators/common.validator.js";

// ======================================================
// Create Investment
// ======================================================

export const createInvestmentSchema = z.object({
    body: z.object({
        account: objectId.optional(),

        name: z
            .string({
                required_error: "Investment name is required.",
            })
            .trim()
            .min(2, "Investment name must be at least 2 characters.")
            .max(100, "Investment name cannot exceed 100 characters."),

        symbol: z
            .string()
            .trim()
            .toUpperCase()
            .max(20, "Symbol cannot exceed 20 characters.")
            .optional(),

        type: z.enum(INVESTMENT_TYPES),

        quantity: z.coerce
            .number()
            .positive("Quantity must be greater than zero."),

        purchasePrice: moneySchema,

        currentPrice: moneySchema,

        purchaseDate: z.coerce.date(),

        riskLevel: z
            .enum(RISK_LEVELS)
            .optional(),

        broker: z
            .string()
            .trim()
            .max(100)
            .optional(),

        notes: z
            .string()
            .trim()
            .max(500)
            .optional(),
    }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Update Investment
// ======================================================

export const updateInvestmentSchema = z.object({
    body: z
        .object({
            account: objectId.optional(),

            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            symbol: z
                .string()
                .trim()
                .toUpperCase()
                .max(20)
                .optional(),

            type: z
                .enum(INVESTMENT_TYPES)
                .optional(),

            quantity: z.coerce
                .number()
                .positive()
                .optional(),

            purchasePrice: moneySchema.optional(),

            currentPrice: moneySchema.optional(),

            purchaseDate: z.coerce
                .date()
                .optional(),

            riskLevel: z
                .enum(RISK_LEVELS)
                .optional(),

            broker: z
                .string()
                .trim()
                .max(100)
                .optional(),

            notes: z
                .string()
                .trim()
                .max(500)
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
        id: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Delete Investment
// ======================================================

export const deleteInvestmentSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Investment
// ======================================================

export const getInvestmentSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Investments
// ======================================================

export const getInvestmentsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(searchSchema)
        .merge(dateRangeSchema)
        .merge(sortOrderSchema)
        .extend({
            account: objectId.optional(),

            type: z
                .enum(INVESTMENT_TYPES)
                .optional(),

            riskLevel: z
                .enum(RISK_LEVELS)
                .optional(),

            sortBy: z
                .enum([
                    "name",
                    "purchaseDate",
                    "quantity",
                    "createdAt",
                    "purchasePrice.amount",
                    "currentPrice.amount",
                ])
                .default("createdAt"),
        })
        .superRefine(dateRangeRefinement),
}); 
// ======================================================
// Buy / Sell Investment (trade)
// ======================================================

export const investmentTradeSchema = z.object({
    body: z.object({
        quantity: z.coerce
            .number({ invalid_type_error: "Quantity must be a number." })
            .positive("Quantity must be greater than zero."),

        price: z.coerce
            .number({ invalid_type_error: "Price must be a number." })
            .positive("Price must be greater than zero."),

        transactionDate: z.coerce.date().optional(),

        notes: z.string().trim().max(500).optional(),
    }),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Update Current Price
// ======================================================

export const updateCurrentPriceSchema = z.object({
    body: z.object({
        currentPrice: z.coerce
            .number({ invalid_type_error: "Current price must be a number." })
            .nonnegative("Current price cannot be negative."),
    }),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});
