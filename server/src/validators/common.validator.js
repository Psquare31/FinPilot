import { z } from "zod";

import { USER_CURRENCIES } from "../constants/index.js";

export const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId.");

export const moneySchema = z.object({
    amount: z.coerce
        .number({
            invalid_type_error: "Amount must be a number.",
        })
        .positive("Amount must be greater than zero."),

    currency: z
        .string()
        .trim()
        .toUpperCase()
        .pipe(
            z.enum(USER_CURRENCIES, {
                errorMap: () => ({ message: "Invalid currency." }),
            })
        ),
});

export const paginationSchema = z.object({
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
});

export const searchSchema = z.object({
    search: z
        .string()
        .trim()
        .max(100, "Search query cannot exceed 100 characters.")
        .optional(),
});

// Plain object (no refinement) so it can be safely `.merge()`d into
// query schemas under Zod v4. Apply `dateRangeRefinement` on the
// composed schema to keep the fromDate <= toDate cross-field check.
export const dateRangeSchema = z.object({
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
});

export const dateRangeRefinement = (data, ctx) => {
    if (
        data.fromDate &&
        data.toDate &&
        data.fromDate > data.toDate
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["toDate"],
            message: "To date must be after from date.",
        });
    }
};

export const sortOrderSchema = z.object({
    sortOrder: z
        .enum(["asc", "desc"])
        .default("desc"),
});