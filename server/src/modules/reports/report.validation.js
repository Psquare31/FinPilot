import { z } from "zod";

import {
    REPORT_TYPES,
    REPORT_STATUS,
    REPORT_FORMATS,
} from "../../constants/index.js";

import {
    objectId,
    paginationSchema,
    dateRangeSchema,
    dateRangeRefinement,
    sortOrderSchema,
} from "../../validators/common.validator.js";

// ======================================================
// Generate Report
// ======================================================

export const generateReportSchema = z.object({
    body: z
        .object({
            title: z
                .string()
                .trim()
                .min(2, "Report title must be at least 2 characters.")
                .max(150, "Report title cannot exceed 150 characters.")
                .optional(),

            type: z.enum(REPORT_TYPES, {
                errorMap: () => ({ message: "Invalid report type." }),
            }),

            format: z
                .enum(REPORT_FORMATS, {
                    errorMap: () => ({ message: "Invalid report format." }),
                })
                .optional(),

            fromDate: z.coerce.date().optional(),

            toDate: z.coerce.date().optional(),

            filters: z.record(z.any()).optional(),
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
        }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Delete Report
// ======================================================

export const deleteReportSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Single Report
// ======================================================

export const getReportSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Reports
// ======================================================

export const getReportsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(dateRangeSchema)
        .merge(sortOrderSchema)
        .extend({
            type: z.enum(REPORT_TYPES).optional(),

            status: z.enum(REPORT_STATUS).optional(),

            format: z.enum(REPORT_FORMATS).optional(),

            generatedBy: objectId.optional(),

            sortBy: z
                .enum(["createdAt", "generatedAt", "type", "status"])
                .default("createdAt"),
        })
        .superRefine(dateRangeRefinement),
});
