import { z } from "zod";

const passwordField = z
    .string({ required_error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters.");

const emailField = z
    .string({ required_error: "Email is required." })
    .trim()
    .toLowerCase()
    .email("Please enter a valid email.");

export const registerSchema = z.object({
    body: z.object({
        firstName: z
            .string({ required_error: "First name is required." })
            .trim()
            .min(2, "First name must be at least 2 characters.")
            .max(50),

        lastName: z
            .string({ required_error: "Last name is required." })
            .trim()
            .min(2, "Last name must be at least 2 characters.")
            .max(50),

        email: emailField,

        password: passwordField,
    }),
    params: z.object({}),
    query: z.object({}),
});

export const loginSchema = z.object({
    body: z.object({
        email: emailField,
        password: z
            .string({ required_error: "Password is required." })
            .min(1, "Password is required."),
    }),
    params: z.object({}),
    query: z.object({}),
});

export const refreshSchema = z.object({
    body: z
        .object({
            refreshToken: z.string().optional(),
        })
        .optional(),
    params: z.object({}),
    query: z.object({}),
});

export const logoutSchema = refreshSchema;

export const syncUserSchema = z.object({
    body: z.object({}).optional(),
    params: z.object({}),
    query: z.object({}),
});

export const updateProfileSchema = z.object({
    body: z.object({
        preferredCurrency: z
            .string()
            .length(3)
            .optional(),

        theme: z
            .enum(["light", "dark", "system"])
            .optional(),
    }),
    params: z.object({}),
    query: z.object({}),
});