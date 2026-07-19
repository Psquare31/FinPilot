import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // =====================================
  // App
  // =====================================

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_URL: z
    .string()
    .trim()
    .url("CLIENT_URL must be a valid URL.")
    .default("http://localhost:5173"),

  // =====================================
  // Database
  // =====================================

  MONGO_URI: z
    .string({
      required_error: "MONGO_URI is required.",
    })
    .trim()
    .min(1, "MONGO_URI cannot be empty."),

  // =====================================
  // JWT
  // =====================================

  JWT_ACCESS_SECRET: z
    .string({
      required_error: "JWT_ACCESS_SECRET is required.",
    })
    .min(16, "JWT_ACCESS_SECRET must be at least 16 characters."),

  JWT_REFRESH_SECRET: z
    .string({
      required_error: "JWT_REFRESH_SECRET is required.",
    })
    .min(16, "JWT_REFRESH_SECRET must be at least 16 characters."),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .trim()
    .default("15m"),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .trim()
    .default("7d"),

  // =====================================
  // Redis
  // =====================================

  UPSTASH_REDIS_REST_URL: z
    .string({
      required_error: "UPSTASH_REDIS_REST_URL is required.",
    })
    .trim()
    .url("UPSTASH_REDIS_REST_URL must be a valid URL."),

  UPSTASH_REDIS_REST_TOKEN: z
    .string({
      required_error: "UPSTASH_REDIS_REST_TOKEN is required.",
    })
    .trim()
    .min(1, "UPSTASH_REDIS_REST_TOKEN cannot be empty."),

  // =====================================
  // SMTP
  // =====================================

  SMTP_EMAIL: z
    .string({
      required_error: "SMTP_EMAIL is required.",
    })
    .email("Invalid SMTP_EMAIL."),

  SMTP_PASSWORD: z
    .string({
      required_error: "SMTP_PASSWORD is required.",
    })
    .min(1, "SMTP_PASSWORD cannot be empty."),

  SMTP_HOST: z
    .string({
      required_error: "SMTP_HOST is required.",
    })
    .min(1, "SMTP_HOST cannot be empty."),

  SMTP_PORT: z.coerce
    .number()
    .int()
    .positive(),

  SMTP_SECURE: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),

  // =====================================
  // Clerk
  // =====================================

  // Clerk keys are optional so the app can run in DEMO_AUTH mode
  // (live classroom demo) without a Clerk account. When DEMO_AUTH
  // is off, authentication falls back to the real Clerk flow and
  // these must be provided.
  CLERK_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .default(""),

  CLERK_SECRET_KEY: z
    .string()
    .trim()
    .default(""),

  // =====================================
  // Demo mode
  // =====================================
  // When "true", every request is authenticated as a fixed local
  // demo user (created on demand in MongoDB) and Clerk is bypassed
  // entirely. Intended for offline demos / evaluation only.
  DEMO_AUTH: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

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