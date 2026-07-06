import { z } from "zod";

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