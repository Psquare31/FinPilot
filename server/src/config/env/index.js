import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),

    PORT: z.coerce.number().int().positive().default(5000),

    MONGO_URI: z
        .string({ required_error: "MONGO_URI is required." })
        .trim()
        .min(1, "MONGO_URI cannot be empty."),

    CLIENT_URL: z
        .string()
        .trim()
        .default("http://localhost:5173"),

    JWT_ACCESS_SECRET: z
        .string({ required_error: "JWT_ACCESS_SECRET is required." })
        .min(16, "JWT_ACCESS_SECRET must be at least 16 characters."),

    JWT_REFRESH_SECRET: z
        .string({ required_error: "JWT_REFRESH_SECRET is required." })
        .min(16, "JWT_REFRESH_SECRET must be at least 16 characters."),

    JWT_ACCESS_EXPIRES_IN: z.string().trim().default("15m"),

    JWT_REFRESH_EXPIRES_IN: z.string().trim().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const details = parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");

    // Logger depends on env, so use the console directly here.
    console.error(
        `\n❌ Invalid environment configuration:\n${details}\n`
    );

    process.exit(1);
}

const env = Object.freeze({
    ...parsed.data,
    isProduction: parsed.data.NODE_ENV === "production",
    isDevelopment: parsed.data.NODE_ENV === "development",
    isTest: parsed.data.NODE_ENV === "test",
});

export default env;
