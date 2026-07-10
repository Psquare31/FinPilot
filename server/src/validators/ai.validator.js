import { z } from "zod";

import {
    AI_FEATURES,
    AI_INTERACTION_STATUS,
} from "../constants/index.js";

import {
    objectId,
    paginationSchema,
    dateRangeSchema,
    dateRangeRefinement,
    sortOrderSchema,
} from "./common.validator.js";

// ======================================================
// Chat with the AI assistant
// ======================================================

export const aiChatSchema = z.object({
    body: z.object({
        message: z
            .string({
                required_error: "Message is required.",
            })
            .trim()
            .min(1, "Message cannot be empty.")
            .max(4000, "Message cannot exceed 4000 characters."),

        conversationId: objectId.optional(),

        context: z.record(z.any()).optional(),
    }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Categorize a transaction (AI suggestion)
// ======================================================

export const aiCategorizeSchema = z.object({
    body: z
        .object({
            transaction: objectId.optional(),

            merchant: z
                .string()
                .trim()
                .max(200, "Merchant cannot exceed 200 characters.")
                .optional(),

            description: z
                .string()
                .trim()
                .max(500, "Description cannot exceed 500 characters.")
                .optional(),

            amount: z.coerce.number().optional(),
        })
        .refine(
            (data) =>
                Boolean(data.transaction) ||
                Boolean(data.merchant) ||
                Boolean(data.description),
            {
                message:
                    "Provide a transaction id, merchant, or description to categorize.",
            }
        ),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Analyze a receipt image (Gemini vision)
// ======================================================

export const aiReceiptSchema = z.object({
    body: z.object({
        imageUrl: z
            .string({
                required_error: "Receipt image URL is required.",
            })
            .trim()
            .url("Receipt image must be a valid URL."),

        account: objectId.optional(),
    }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Generate an insight for a feature
// ======================================================

export const aiInsightSchema = z.object({
    body: z.object({
        feature: z.enum(AI_FEATURES, {
            errorMap: () => ({ message: "Invalid AI feature." }),
        }),

        fromDate: z.coerce.date().optional(),

        toDate: z.coerce.date().optional(),

        context: z.record(z.any()).optional(),
    }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Get AI interaction history / usage logs
// ======================================================

export const getAiInteractionsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(dateRangeSchema)
        .merge(sortOrderSchema)
        .extend({
            feature: z.enum(AI_FEATURES).optional(),

            status: z.enum(AI_INTERACTION_STATUS).optional(),

            user: objectId.optional(),

            sortBy: z
                .enum(["createdAt", "feature", "status", "estimatedCost"])
                .default("createdAt"),
        })
        .superRefine(dateRangeRefinement),
});

// ======================================================
// Create AI Interaction (log a raw interaction record)
// ======================================================

export const createAIInteractionSchema = z.object({
    body: z.object({
        workspace: objectId,

        user: objectId.optional(),

        feature: z.enum(AI_FEATURES, {
            errorMap: () => ({ message: "Invalid AI feature." }),
        }),

        prompt: z
            .string({ required_error: "Prompt is required." })
            .trim()
            .min(1, "Prompt cannot be empty.")
            .max(8000, "Prompt cannot exceed 8000 characters."),

        model: z.string().trim().max(100).optional(),

        response: z.string().max(20000).optional(),

        status: z.enum(AI_INTERACTION_STATUS).optional(),

        metadata: z.record(z.any()).optional(),
    }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Record Feedback
// ======================================================

export const feedbackSchema = z.object({
    body: z.object({
        feedback: z
            .object({
                rating: z.coerce.number().int().min(1).max(5).optional(),
                helpful: z.boolean().optional(),
                comment: z.string().trim().max(1000).optional(),
            })
            .refine((data) => Object.keys(data).length > 0, {
                message: "Provide a rating, helpful flag, or comment.",
            }),
    }),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});
