// ======================================================
// Benchmark database connection.
//
// Deliberately NOT src/config/database/connectDB.js. That reads MONGO_URI,
// which points at the shared development cluster. Benchmarks must never write
// to it, and a network-attached cluster would add latency variance that swamps
// the effects being measured.
//
// BENCH_MONGO_URI defaults to a local instance on 27018 (see bench/README.md).
// ======================================================

import mongoose from "mongoose";

export const BENCH_MONGO_URI =
  process.env.BENCH_MONGO_URI || "mongodb://127.0.0.1:27018/finpilot_bench";

// Refuse to run against anything that is not an explicitly local benchmark
// database. Cheap insurance against a stray env var pointed at production.
const assertSafeTarget = (uri) => {
  const isLocal = /(^mongodb:\/\/)(127\.0\.0\.1|localhost)(:|\/)/.test(uri);

  if (!isLocal) {
    throw new Error(
      `Refusing to run benchmarks against a non-local database: ${uri}\n` +
        "Benchmarks drop collections and rebuild indexes. Point BENCH_MONGO_URI " +
        "at a local instance."
    );
  }

  if (!/finpilot_bench/.test(uri)) {
    throw new Error(
      `Refusing to run benchmarks against database that is not named ` +
        `"finpilot_bench": ${uri}`
    );
  }
};

export const connectBenchDB = async (uri = BENCH_MONGO_URI) => {
  assertSafeTarget(uri);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    // Indexes are created explicitly per-experiment, so autoIndex would
    // silently rebuild them and contaminate the index/no-index comparison.
    autoIndex: false,
  });

  return mongoose.connection;
};

export const disconnectBenchDB = async () => {
  await mongoose.connection.close();
};

export default connectBenchDB;
