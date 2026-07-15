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
