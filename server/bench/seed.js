// ======================================================
// Benchmark dataset seeder.
//
//   node bench/seed.js --transactions=100000 [--seed=42] [--workspaces=3]
//                      [--accounts=6] [--batch=5000]
//
// Drops and rebuilds the benchmark database, then writes a manifest describing
// exactly what was generated. The manifest is the dataset description the
// report cites — it must be produced by the run, never written by hand.
// ======================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";

import connectBenchDB, {
  disconnectBenchDB,
  BENCH_MONGO_URI,
} from "./lib/db.js";

import {
  buildBaseEntities,
  generateTransactionBatches,
  REFERENCE_DATE,
  HISTORY_MONTHS,
} from "./lib/dataset.js";

import User from "../src/models/User.js";
import Workspace from "../src/models/Workspace.js";
import Category from "../src/models/Category.js";
import Account from "../src/models/Account.js";
import Transaction from "../src/models/Transaction.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESULTS_DIR = path.join(__dirname, "results");

// ======================================================
// Arguments
// ======================================================

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .filter((arg) => arg.startsWith("--"))
      .map((arg) => {
        const [key, value] = arg.replace(/^--/, "").split("=");

        return [key, value ?? "true"];
      })
  );

  return {
    transactions: Number(args.transactions ?? 10000),
    seed: Number(args.seed ?? 42),
    workspaceCount: Number(args.workspaces ?? 3),
    accountsPerWorkspace: Number(args.accounts ?? 6),
    batchSize: Number(args.batch ?? 5000),
  };
};

// ======================================================
// Seed
// ======================================================

const run = async () => {
  const options = parseArgs();

  if (!Number.isFinite(options.transactions) || options.transactions < 1) {
    throw new Error("--transactions must be a positive integer");
  }

  console.log(`Connecting to ${BENCH_MONGO_URI}`);

  await connectBenchDB();

  // A benchmark must start from a known-empty state; leftover documents from a
  // previous scale would silently inflate every subsequent measurement.
  console.log("Dropping existing benchmark database...");

  await mongoose.connection.dropDatabase();

  const base = buildBaseEntities({
    seed: options.seed,
    workspaceCount: options.workspaceCount,
    accountsPerWorkspace: options.accountsPerWorkspace,
  });

  await User.create(base.user);

  await Workspace.insertMany(base.workspaces);

  // `weight` drives the generator's distribution but is not part of the
  // Category schema; strip it rather than relying on strict-mode to drop it.
  await Category.insertMany(
    base.categories.map(({ weight: _weight, ...category }) => category)
  );

  await Account.insertMany(base.accounts);

  console.log(
    `Base entities: 1 user, ${base.workspaces.length} workspaces, ` +
      `${base.categories.length} categories, ${base.accounts.length} accounts`
  );

  console.log(`Generating ${options.transactions.toLocaleString()} transactions...`);

  const startedAt = Date.now();

  let inserted = 0;

  const batches = generateTransactionBatches({
    rng: base.rng,
    base,
    total: options.transactions,
    batchSize: options.batchSize,
  });

  for (const batch of batches) {
    // Validation stays ON: it is the only thing proving the generated shapes
    // match what the application actually writes.
    //
    // throwOnValidationError is REQUIRED here. With `ordered: false` Mongoose
    // defaults it to false, collecting validation errors into the result and
    // resolving successfully — so a fully-rejected batch looks identical to a
    // successful one. Without this flag the seeder reported "1,000 inserted"
    // into an empty collection.
    const result = await Transaction.insertMany(batch, {
      ordered: false,
      throwOnValidationError: true,
      rawResult: true,
    });

    if (result.insertedCount !== batch.length) {
      throw new Error(
        `Expected to insert ${batch.length} documents, inserted ` +
          `${result.insertedCount}. Refusing to report a partial load.`
      );
    }

    inserted += result.insertedCount;

    if (inserted % 50000 === 0 || inserted === options.transactions) {
      const elapsed = (Date.now() - startedAt) / 1000;

      console.log(
        `  ${inserted.toLocaleString()} / ${options.transactions.toLocaleString()} ` +
          `(${Math.round(inserted / elapsed).toLocaleString()} docs/s)`
      );
    }
  }

  const insertSeconds = (Date.now() - startedAt) / 1000;

  // Indexes are built AFTER the load. Building them up-front would both slow
  // the insert and conflate index-build cost with query cost.
  console.log("Building indexes...");

  const indexStartedAt = Date.now();

  await Transaction.syncIndexes();
  await Account.syncIndexes();
  await Category.syncIndexes();
  await Workspace.syncIndexes();

  const indexSeconds = (Date.now() - indexStartedAt) / 1000;

  // Verify against the database rather than trusting the in-process counter.
  // An earlier revision of this script reported a successful load into an
  // empty collection; a manifest must never be written on unverified counts.
  const persisted = await Transaction.countDocuments();

  if (persisted !== options.transactions) {
    throw new Error(
      `Verification failed: expected ${options.transactions} transactions in ` +
        `the database, found ${persisted}.`
    );
  }

  const stats = await mongoose.connection.db
    .collection("transactions")
    .aggregate([
      {
        $collStats: { storageStats: {} },
      },
    ])
    .next();

  const storageStats = stats.storageStats;

  const manifest = {
    generatedAt: new Date().toISOString(),
    uri: BENCH_MONGO_URI,
    options,
    determinism: {
      seed: options.seed,
      referenceDate: REFERENCE_DATE.toISOString(),
      historyMonths: HISTORY_MONTHS,
      note: "Same seed + same options reproduce this dataset exactly, _ids included.",
    },
    counts: {
      users: 1,
      workspaces: base.workspaces.length,
      categories: base.categories.length,
      accounts: base.accounts.length,
      transactions: persisted,
    },
    storage: {
      dataSizeBytes: storageStats.size,
      storageSizeBytes: storageStats.storageSize,
      totalIndexSizeBytes: storageStats.totalIndexSize,
      avgDocumentBytes: Math.round(storageStats.avgObjSize),
      indexSizesBytes: storageStats.indexSizes,
    },
    timings: {
      insertSeconds: Number(insertSeconds.toFixed(2)),
      insertDocsPerSecond: Math.round(inserted / insertSeconds),
      indexBuildSeconds: Number(indexSeconds.toFixed(2)),
    },
  };

  await fs.mkdir(RESULTS_DIR, { recursive: true });

  const manifestPath = path.join(
    RESULTS_DIR,
    `dataset-${options.transactions}.json`
  );

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\nSeeded ${inserted.toLocaleString()} transactions in ${insertSeconds}s`);
  console.log(`Indexes built in ${indexSeconds}s`);
  console.log(`Manifest: ${path.relative(process.cwd(), manifestPath)}`);

  await disconnectBenchDB();
};

run().catch(async (error) => {
  console.error(error);

  await disconnectBenchDB().catch(() => {});

  process.exit(1);
});
