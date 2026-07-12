import { z } from "zod";

import { CATEGORY_TYPES } from "./category.constants.js";
import { objectId } from "../../validators/common.validator.js";

// =========================================
// Create Category
// =========================================

export const createCategorySchema = z.object({
    body: z.object({
        workspace: objectId,
        name: z
            .string({
                required_error: "Category name is required.",
                invalid_type_error: "Category name must be a string.",
            })
            .trim()
            .min(2, "Category name must be at least 2 characters.")
            .max(50, "Category name must be at most 50 characters."),

        type: z.enum(CATEGORY_TYPES, {
            errorMap: () => ({
                message: "Please select a valid category type.",
            }),
        }),

        icon: z
            .string({
                invalid_type_error: "Icon must be a string.",
            })
            .trim()
            .max(50, "Icon cannot exceed 50 characters.")
            .optional(),

        color: z
            .string({
                invalid_type_error: "Color must be a string.",
            })
            .trim()
            .max(30, "Color cannot exceed 30 characters.")
            .optional(),

        description: z
            .string({
                invalid_type_error: "Description must be a string.",
            })
            .trim()
            .max(200, "Description cannot exceed 200 characters.")
            .optional(),

        parentCategory: objectId.optional(),

        isDefault: z.boolean({
            invalid_type_error: "isDefault must be true or false.",
        }).optional(),
    }),

    params: z.object({}),

    query: z.object({}),
});

// =========================================
// Update Category
// =========================================

export const updateCategorySchema = z.object({
    body: z
        .object({
            name: z
                .string({
                    invalid_type_error: "Category name must be a string.",
                })
                .trim()
                .min(2, "Category name must be at least 2 characters.")
                .max(50, "Category name must be at most 50 characters.")
                .optional(),

            type: z.enum(CATEGORY_TYPES, {
                errorMap: () => ({
                    message: "Please select a valid category type.",
                }),
            }).optional(),

            icon: z
                .string({
                    invalid_type_error: "Icon must be a string.",
                })
                .trim()
                .max(50, "Icon cannot exceed 50 characters.")
                .optional(),

            color: z
                .string({
                    invalid_type_error: "Color must be a string.",
                })
                .trim()
                .max(30, "Color cannot exceed 30 characters.")
                .optional(),

            description: z
                .string({
                    invalid_type_error: "Description must be a string.",
                })
                .trim()
                .max(200, "Description cannot exceed 200 characters.")
                .optional(),

            parentCategory: objectId.optional(),

            isArchived: z.boolean({
                invalid_type_error: "isArchived must be true or false.",
            }).optional(),
        })
        .refine(
            (data) => Object.keys(data).length > 0,
            {
                message:
                    "At least one field must be provided for update.",
            }
        ),

    params: z.object({
        categoryId: objectId,
    }),

    query: z.object({}),
});

// =========================================
// Delete Category
// =========================================

export const deleteCategorySchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        categoryId: objectId,
    }),

    query: z.object({}),
});

// =========================================
// Get Category
// =========================================

export const getCategorySchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        categoryId: objectId,
    }),

    query: z.object({}),
});

// =========================================
// Get Categories
// =========================================

export const getCategoriesSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: z.object({
        page: z.coerce
            .number()
            .int("Page must be an integer.")
            .positive("Page must be greater than 0.")
            .optional(),

        limit: z.coerce
            .number()
            .int("Limit must be an integer.")
            .positive("Limit must be greater than 0.")
            .max(100, "Limit cannot exceed 100.")
            .optional(),

        search: z
            .string({
                invalid_type_error: "Search must be a string.",
            })
            .trim()
            .optional(),

        type: z.enum(CATEGORY_TYPES, {
            errorMap: () => ({
                message: "Please select a valid category type.",
            }),
        }).optional(),

        archived: z.coerce
            .boolean({
                invalid_type_error: "Archived must be true or false.",
            })
            .optional(),
    }),
});
// ======================================================
// Clone Default Categories
// ======================================================

export const cloneDefaultCategoriesSchema = z.object({
    body: z.object({
        workspace: objectId,
    }),

    params: z.object({}),

    query: z.object({}),
});
