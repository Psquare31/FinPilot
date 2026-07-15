import { z } from "zod";

import {
    USER_CURRENCIES,
    USER_THEMES,
} from "../../constants/index.js";

export const updateProfileSchema = z.object({
    body: z
        .object({
            firstName: z
                .string()
                .trim()
                .min(2, "First name must be at least 2 characters.")
                .max(50, "First name cannot exceed 50 characters.")
                .optional(),

            lastName: z
                .string()
                .trim()
                .min(2, "Last name must be at least 2 characters.")
                .max(50, "Last name cannot exceed 50 characters.")
                .optional(),

            username: z
                .string()
                .trim()
                .min(3, "Username must be at least 3 characters.")
                .max(30, "Username cannot exceed 30 characters.")
                .regex(
                    /^[a-zA-Z0-9_]+$/,
                    "Username can only contain letters, numbers and underscores."
                )
                .optional(),

            phoneNumber: z
                .string()
                .trim()
                .min(8, "Phone number is too short.")
                .max(20, "Phone number is too long.")
                .optional(),

            profileImage: z
                .string()
                .trim()
                .url("Profile image must be a valid URL.")
                .optional(),

            preferredCurrency: z
                .enum(USER_CURRENCIES)
                .optional(),

            timezone: z
                .string()
                .trim()
                .min(1, "Timezone is required.")
                .max(100, "Invalid timezone.")
                .optional(),

            theme: z
                .enum(USER_THEMES)
                .optional(),
        })
        .strict(),

    params: z.object({}),

    query: z.object({}),
});

export const completeOnboardingSchema = z.object({
    body: z
        .object({
            preferredCurrency: z.enum(USER_CURRENCIES, {
                required_error: "Preferred currency is required.",
            }),

            timezone: z
                .string({
                    required_error: "Timezone is required.",
                })
                .trim()
                .min(1, "Timezone is required.")
                .max(100, "Invalid timezone."),

            workspaceName: z
                .string({
                    required_error: "Workspace name is required.",
                })
                .trim()
                .min(2, "Workspace name must be at least 2 characters.")
                .max(100, "Workspace name cannot exceed 100 characters."),

            theme: z
                .enum(USER_THEMES)
                .optional(),
        })
        .strict(),

    params: z.object({}),

    query: z.object({}),
});