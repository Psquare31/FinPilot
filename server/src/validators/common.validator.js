import { z } from "zod";

export const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId.");

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

export const dateRangeSchema = z
    .object({
        fromDate: z.coerce.date().optional(),
        toDate: z.coerce.date().optional(),
    })
    .superRefine((data, ctx) => {
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
    });

export const sortOrderSchema = z.object({
    sortOrder: z
        .enum(["asc", "desc"])
        .default("desc"),
});