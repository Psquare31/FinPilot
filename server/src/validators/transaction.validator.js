import { z } from "zod";

import {
    TRANSACTION_TYPES,
    TRANSACTION_STATUS,
    PAYMENT_METHODS,
    USER_CURRENCIES,
} from "../constants/index.js";

import { objectId } from "./common.validator.js";

// =====================================================
// Nested Schemas
// =====================================================

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

const merchantSchema = z.object({
    name: z
        .string()
        .trim()
        .max(100)
        .optional(),

    type: z
        .string()
        .trim()
        .optional(),

    website: z
        .string()
        .url("Merchant website must be a valid URL.")
        .optional(),

    email: z
        .string()
        .email("Invalid merchant email.")
        .optional(),

    phone: z
        .string()
        .trim()
        .optional(),
});

const locationSchema = z.object({
    latitude: z.number().optional(),

    longitude: z.number().optional(),

    address: z
        .string()
        .trim()
        .optional(),

    city: z
        .string()
        .trim()
        .optional(),

    country: z
        .string()
        .trim()
        .optional(),
});

const attachmentSchema = z.object({
    url: z.string().url(),

    publicId: z.string(),

    fileName: z.string(),

    mimeType: z.string(),

    size: z.coerce.number(),
});

const recurringSchema = z.object({
    enabled: z.boolean().optional(),

    frequency: z.string().optional(),

    nextDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),
});

// =====================================================
// Create Transaction
// =====================================================

export const createTransactionSchema = z.object({
    body: z.object({

        account: objectId,

        transferAccount: objectId.optional(),

        category: objectId,

        type: z.enum(TRANSACTION_TYPES),

        status: z
            .enum(TRANSACTION_STATUS)
            .optional(),

        money: moneySchema,

        merchant: merchantSchema.optional(),

        paymentMethod: z
            .enum(PAYMENT_METHODS)
            .optional(),

        description: z
            .string()
            .trim()
            .max(500)
            .optional(),

        notes: z
            .string()
            .trim()
            .max(1000)
            .optional(),

        tags: z
            .array(
                z.string().trim().toLowerCase()
            )
            .optional(),

        location: locationSchema.optional(),

        recurring: recurringSchema.optional(),

        attachments: z
            .array(attachmentSchema)
            .optional(),

        receiptNumber: z
            .string()
            .trim()
            .max(100)
            .optional(),

        transactionDate: z
            .coerce
            .date()
            .optional(),

        isSplit: z
            .boolean()
            .optional(),

        parentTransaction: objectId.optional(),

    })
    .superRefine((data, ctx) => {

        if (
            data.type === "transfer"
        ) {

            if (!data.transferAccount) {

                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["transferAccount"],
                    message:
                        "Transfer account is required for transfer transactions.",
                });

            }

            if (
                data.transferAccount &&
                data.transferAccount === data.account
            ) {

                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["transferAccount"],
                    message:
                        "Transfer account cannot be the same as the source account.",
                });

            }

        }

    }),

    params: z.object({}),

    query: z.object({}),
});

// =====================================================
// Update Transaction
// =====================================================

export const updateTransactionSchema = z.object({
    body: z
        .object({
            account: objectId.optional(),

            transferAccount: objectId.optional(),

            category: objectId.optional(),

            type: z.enum(TRANSACTION_TYPES).optional(),

            status: z.enum(TRANSACTION_STATUS).optional(),

            money: moneySchema.optional(),

            merchant: merchantSchema.optional(),

            paymentMethod: z
                .enum(PAYMENT_METHODS)
                .optional(),

            description: z
                .string()
                .trim()
                .max(
                    500,
                    "Description cannot exceed 500 characters."
                )
                .optional(),

            notes: z
                .string()
                .trim()
                .max(
                    1000,
                    "Notes cannot exceed 1000 characters."
                )
                .optional(),

            tags: z
                .array(
                    z.string().trim().toLowerCase()
                )
                .optional(),

            location: locationSchema.optional(),

            recurring: recurringSchema.optional(),

            attachments: z
                .array(attachmentSchema)
                .optional(),

            receiptNumber: z
                .string()
                .trim()
                .max(
                    100,
                    "Receipt number cannot exceed 100 characters."
                )
                .optional(),

            transactionDate: z
                .coerce
                .date()
                .optional(),

            isSplit: z.boolean().optional(),

            parentTransaction: objectId.optional(),
        })
        .refine(
            (data) => Object.keys(data).length > 0,
            {
                message:
                    "At least one field must be provided for update.",
            }
        )
        .superRefine((data, ctx) => {
            if (data.type === "transfer") {
                if (!data.transferAccount) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["transferAccount"],
                        message:
                            "Transfer account is required for transfer transactions.",
                    });
                }

                if (
                    data.account &&
                    data.transferAccount &&
                    data.account === data.transferAccount
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["transferAccount"],
                        message:
                            "Transfer account cannot be the same as the source account.",
                    });
                }
            }
        }),

    params: z.object({
        transactionId: objectId,
    }),

    query: z.object({}),
});

// =====================================================
// Delete Transaction
// =====================================================

export const deleteTransactionSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        transactionId: objectId,
    }),

    query: z.object({}),
});

// =====================================================
// Get Single Transaction
// =====================================================

export const getTransactionSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        transactionId: objectId,
    }),

    query: z.object({}),
}); 

// =====================================================
// Get Transactions
// =====================================================

export const getTransactionsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: z.object({
        // Pagination
        page: z.coerce
            .number()
            .int("Page must be an integer.")
            .positive("Page must be greater than 0.")
            .default(1),

        limit: z.coerce
            .number()
            .int("Limit must be an integer.")
            .positive("Limit must be greater than 0.")
            .max(100, "Limit cannot exceed 100.")
            .default(20),

        // Search
        search: z
            .string()
            .trim()
            .max(100, "Search query cannot exceed 100 characters.")
            .optional(),

        // Filters
        account: objectId.optional(),

        category: objectId.optional(),

        transferAccount: objectId.optional(),

        type: z.enum(TRANSACTION_TYPES).optional(),

        status: z.enum(TRANSACTION_STATUS).optional(),

        paymentMethod: z.enum(PAYMENT_METHODS).optional(),

        tags: z
            .array(z.string().trim().toLowerCase())
            .optional(),

        merchant: z
            .string()
            .trim()
            .max(100)
            .optional(),

        receiptNumber: z
            .string()
            .trim()
            .optional(),

        // Amount Filters
        minAmount: z.coerce
            .number()
            .min(0, "Minimum amount cannot be negative.")
            .optional(),

        maxAmount: z.coerce
            .number()
            .min(0, "Maximum amount cannot be negative.")
            .optional(),

        // Date Filters
        fromDate: z.coerce.date().optional(),

        toDate: z.coerce.date().optional(),

        // Flags
        isSplit: z.coerce.boolean().optional(),

        isDeleted: z.coerce.boolean().optional(),

        // Sorting
        sortBy: z
            .enum([
                "transactionDate",
                "createdAt",
                "updatedAt",
                "money.amount",
                "type",
                "status",
            ])
            .default("transactionDate"),

        sortOrder: z
            .enum(["asc", "desc"])
            .default("desc"),
    })
    .superRefine((data, ctx) => {

        if (
            data.minAmount !== undefined &&
            data.maxAmount !== undefined &&
            data.minAmount > data.maxAmount
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["maxAmount"],
                message:
                    "Maximum amount must be greater than or equal to minimum amount.",
            });
        }

        if (
            data.fromDate &&
            data.toDate &&
            data.fromDate > data.toDate
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["toDate"],
                message:
                    "To date must be after from date.",
            });
        }
    }),
});

// =====================================================
// Transfer Transaction
// =====================================================

export const transferTransactionSchema = z.object({
    body: z.object({
        fromAccount: objectId,

        toAccount: objectId,

        amount: moneySchema,

        category: objectId,

        description: z
            .string()
            .trim()
            .max(500)
            .optional(),

        notes: z
            .string()
            .trim()
            .max(1000)
            .optional(),

        transactionDate: z
            .coerce
            .date()
            .optional(),
    })
    .superRefine((data, ctx) => {

        if (data.fromAccount === data.toAccount) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["toAccount"],
                message:
                    "Source and destination accounts cannot be the same.",
            });
        }

    }),

    params: z.object({}),

    query: z.object({}),
});

