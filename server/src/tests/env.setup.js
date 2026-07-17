// Runs BEFORE any module is imported (jest `setupFiles`, not
// `setupFilesAfterEnv`). src/config/env/index.js validates the environment at
// import time and exits the process if anything is missing, so these defaults
// have to exist before the first `import`.
//
// dotenv.config() does not overwrite variables already present in
// process.env, so a developer's real .env cannot leak into a test run.

process.env.NODE_ENV = "test";

// Tests run against a throwaway database, never the development cluster.
process.env.MONGO_URI =
  process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27018/finpilot_test";

process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-not-for-production";

process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-not-for-production";

process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

// Tests run against a real Redis, reached through serverless-redis-http —
// the proxy that speaks Upstash's REST protocol on top of an ordinary Redis
// server. @upstash/redis cannot talk to a plain redis:7 container, and the
// rate limiter fails closed on a Redis error, so pointing this at a dead
// endpoint would make every HTTP test 500 for reasons unrelated to the code
// under test.
//
// See docker-compose.test.yml. Start it with: npm run test:services
process.env.UPSTASH_REDIS_REST_URL =
  process.env.UPSTASH_REDIS_REST_URL || "http://127.0.0.1:8079";

process.env.UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || "test_token";

// Clerk is validated as required at env load, and clerkMiddleware() — mounted
// globally in app.js — additionally parses the publishable key on every
// request, rejecting a malformed one with 500 "Publishable key not valid."
// before any route runs. So the dummy has to be format-valid: pk_test_ plus
// base64 of "<frontend-api-host>$". It resolves to test.clerk.accounts.dev and
// is never contacted; the suite exercises services directly.
process.env.CLERK_PUBLISHABLE_KEY =
  process.env.CLERK_PUBLISHABLE_KEY ||
  "pk_test_dGVzdC5jbGVyay5hY2NvdW50cy5kZXYk";

process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_dummy";

// SMTP is validated as required even though nothing in the suite sends mail.
// These have to be set here rather than left to a developer's .env: CI has no
// .env file at all, so anything not defaulted here is simply undefined and
// env validation calls process.exit(1) at import time.
process.env.SMTP_EMAIL = process.env.SMTP_EMAIL || "test@finpilot.local";
process.env.SMTP_PASSWORD = process.env.SMTP_PASSWORD || "test-password";
process.env.SMTP_HOST = process.env.SMTP_HOST || "127.0.0.1";
process.env.SMTP_PORT = process.env.SMTP_PORT || "1025";
process.env.SMTP_SECURE = process.env.SMTP_SECURE || "false";

process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
