// ======================================================
// E3 — how much of the query an index has to cover.
//
// The query is the one the transaction list issues: a workspace's
// transactions, newest first, first page.
//
//   find({ workspace, isDeleted: false }).sort({ transactionDate: -1 }).limit(20)
//
// Three variants, in decreasing order of index support:
//
//   compound  { workspace: 1, transactionDate: -1 } — matches the filter AND
//             supplies the sort order, so the limit stops after 20 keys
//   filterOnly  only single-field workspace indexes remain: the filter is still
//             served by an index, but the sort is not, so every matching
//             document must be fetched and sorted in memory before the limit
//             applies
//   none      no usable index: a full collection scan
//
// The first draft of this experiment dropped only the compound index and
// called the result "no index". It was not: MongoDB silently fell back to
// workspace_1_isDeleted_1 and still reported IXSCAN. Dropping one index does
// not make a query unindexed — it makes it differently indexed, which is a
// different and easily mistaken measurement.
//
// Reported from explain("executionStats"), not just wall-clock:
//
//   stage              IXSCAN (index-driven) vs COLLSCAN (whole collection)
//   totalDocsExamined  documents MongoDB had to read
//   nReturned          documents the query returned
//   hasBlockingSort    whether a SORT stage ran, i.e. the sort could not be
//                      served by an index
//   sortMemoryBytes    how much the SORT stage buffered
//
// A note on sortMemoryBytes, because it is easy to over-read: it stays around
// 17KB at every scale here, not because the sort is cheap but because
// .limit(20) lets MongoDB run a bounded top-K sort that only ever holds 20
// documents. The 32MB in-memory sort limit is therefore not what this query
// hits. The cost is in the FETCH beneath the SORT — every matching document is
// still read off disk to be considered — which is what totalDocsExamined
// captures. The same query without a limit, or paginated deep enough, is where
// sort memory becomes the binding constraint (see E4).
//
// Wall-clock alone understates all of this: at these sizes the collection fits
// in RAM, so even a scan looks survivable. docsExamined is the work a
// production-sized, disk-resident collection would actually pay for.
//
//   node bench/experiments/e3-index-vs-no-index.js --scales=1000,10000,100000
// ======================================================

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

import connectBenchDB, { disconnectBenchDB } from "../lib/db.js";
import { measure } from "../lib/stats.js";

import Workspace from "../../src/models/Workspace.js";
import Transaction from "../../src/models/Transaction.js";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVER_ROOT = path.resolve(__dirname, "../..");

const RESULTS_DIR = path.join(SERVER_ROOT, "bench", "results");

const INDEX_NAME = "workspace_1_transactionDate_-1";

const INDEX_SPEC = { workspace: 1, transactionDate: -1 };

// The query the transaction list issues: one workspace, newest first, page 1.
const buildQuery = (workspaceId) =>
  Transaction.find({ workspace: workspaceId, isDeleted: false })
    .sort({ transactionDate: -1 })
    .limit(20);

const explain = async (workspaceId) => {
  const result = await buildQuery(workspaceId).explain("executionStats");

  const stats = result.executionStats;

  // Walk the whole stage chain: the leaf tells us IXSCAN vs COLLSCAN, and any
  // SORT along the way means the sort could not be served by an index.
  const chain = [];

  for (let s = stats.executionStages; s; s = s.inputStage) chain.push(s);

  const leaf = chain[chain.length - 1];

  const sortStage = chain.find((s) => s.stage === "SORT");

  return {
    stage: leaf.stage,
    indexName: leaf.indexName ?? null,
    stageChain: chain.map((s) => s.stage).join(" <- "),
    hasBlockingSort: Boolean(sortStage),
    sortMemoryBytes: sortStage?.totalDataSizeSorted ?? 0,
    nReturned: stats.nReturned,
    totalDocsExamined: stats.totalDocsExamined,
    totalKeysExamined: stats.totalKeysExamined,
    executionTimeMillis: stats.executionTimeMillis,
  };
};

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .filter((a) => a.startsWith("--"))
      .map((a) => {
        const [k, v] = a.replace(/^--/, "").split("=");
        return [k, v ?? "true"];
      })
  );

  return {
    scales: (args.scales ?? "1000,10000,100000")
      .split(",")
      .map((s) => Number(s.trim())),
    iterations: Number(args.iterations ?? 20),
    warmup: Number(args.warmup ?? 3),
    seed: Number(args.seed ?? 42),
  };
};

const reseed = (transactions, seed) =>
  execFileAsync(
    process.execPath,
    [path.join("bench", "seed.js"), `--transactions=${transactions}`, `--seed=${seed}`],
    { cwd: SERVER_ROOT, maxBuffer: 1024 * 1024 * 32 }
  );

const run = async () => {
  const options = parseArgs();

  const results = [];

  for (const scale of options.scales) {
    console.log(`\n=== scale: ${scale.toLocaleString()} transactions ===`);

    await reseed(scale, options.seed);

    await connectBenchDB();

    const workspace = await Workspace.findOne().lean();

    const workspaceId = workspace._id;

    const collection = Transaction.collection;

    const scaleResult = { scale, variants: {} };

    // Every index on the collection that could serve this filter. Removing the
    // compound one alone is not enough to make the query unindexed — MongoDB
    // simply picks another.
    const workspaceIndexes = (await collection.indexes())
      .map((i) => i.name)
      .filter((name) => name !== "_id_" && name.startsWith("workspace"));

    const measureVariant = async (label, expectation) => {
      const stats = await explain(workspaceId);

      const { stats: timing, lastValue } = await measure(
        () => buildQuery(workspaceId).lean(),
        { warmup: options.warmup, iterations: options.iterations }
      );

      scaleResult.variants[label] = {
        ...stats,
        ...timing,
        returnedIds: lastValue.map((d) => d._id.toString()),
      };

      console.log(
        `  ${label.padEnd(11)} ${stats.stage.padEnd(9)} ` +
          `examined ${String(stats.totalDocsExamined).padStart(7)}  ` +
          `returned ${String(stats.nReturned).padStart(3)}  ` +
          `sort ${(stats.hasBlockingSort ? "in-memory" : "index").padEnd(9)} ` +
          `p50 ${String(timing.p50Ms).padStart(8)} ms`
      );

      if (expectation && stats.stage !== expectation) {
        throw new Error(
          `${label}: expected ${expectation} but the planner chose ` +
            `${stats.stage} (${stats.indexName}). The variant does not measure ` +
            `what it claims.`
        );
      }
    };

    // 1. compound index present — filter and sort both served
    await measureVariant("compound", "IXSCAN");

    // 2. drop the compound index; the filter is still indexed, the sort is not
    await collection.dropIndex(INDEX_NAME);

    await measureVariant("filterOnly", "IXSCAN");

    // 3. drop every workspace index; nothing is left to serve the query
    for (const name of workspaceIndexes) {
      if (name !== INDEX_NAME) await collection.dropIndex(name);
    }

    await measureVariant("none", "COLLSCAN");

    // Restore the collection to how the seeder built it, so the next scale is
    // not measured against a stripped collection.
    await collection.createIndex(INDEX_SPEC, { name: INDEX_NAME });

    await Transaction.syncIndexes();

    // An index changes how a query runs, never what it returns. If the three
    // variants disagree, they are not answering the same question and the
    // comparison is meaningless.
    const [a, b, c] = [
      scaleResult.variants.compound.returnedIds,
      scaleResult.variants.filterOnly.returnedIds,
      scaleResult.variants.none.returnedIds,
    ];

    scaleResult.allVariantsAgree =
      JSON.stringify(a) === JSON.stringify(b) &&
      JSON.stringify(b) === JSON.stringify(c);

    if (!scaleResult.allVariantsAgree) {
      throw new Error(
        "Variants returned different documents; the comparison is invalid."
      );
    }

    // Drop the id lists from the report — they exist to verify agreement, not
    // to be published.
    for (const v of Object.values(scaleResult.variants)) delete v.returnedIds;

    const compound = scaleResult.variants.compound;
    const filterOnly = scaleResult.variants.filterOnly;
    const none = scaleResult.variants.none;

    scaleResult.ratios = {
      filterOnlyDocsExaminedVsCompound: Number(
        (filterOnly.totalDocsExamined / Math.max(compound.totalDocsExamined, 1)).toFixed(1)
      ),
      noneDocsExaminedVsCompound: Number(
        (none.totalDocsExamined / Math.max(compound.totalDocsExamined, 1)).toFixed(1)
      ),
      filterOnlyLatencyVsCompound: Number(
        (filterOnly.p50Ms / Math.max(compound.p50Ms, 0.001)).toFixed(2)
      ),
      noneLatencyVsCompound: Number(
        (none.p50Ms / Math.max(compound.p50Ms, 0.001)).toFixed(2)
      ),
    };

    console.log(
      `  -> vs compound: filterOnly examines ` +
        `${scaleResult.ratios.filterOnlyDocsExaminedVsCompound}x more ` +
        `(${scaleResult.ratios.filterOnlyLatencyVsCompound}x slower); ` +
        `none examines ${scaleResult.ratios.noneDocsExaminedVsCompound}x more ` +
        `(${scaleResult.ratios.noneLatencyVsCompound}x slower)`
    );

    results.push(scaleResult);

    await disconnectBenchDB();
  }

  const report = {
    experiment: "E3 — index coverage: compound (filter+sort) vs filter-only vs none",
    generatedAt: new Date().toISOString(),
    query: "find({ workspace, isDeleted: false }).sort({ transactionDate: -1 }).limit(20)",
    index: INDEX_NAME,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
    },
    options,
    results,
  };

  await fs.mkdir(RESULTS_DIR, { recursive: true });

  const outPath = path.join(RESULTS_DIR, "e3-index-vs-no-index.json");

  await fs.writeFile(outPath, JSON.stringify(report, null, 2));

  console.log(`\nWrote ${path.relative(SERVER_ROOT, outPath)}`);
};

run().catch(async (error) => {
  console.error(error);

  await disconnectBenchDB().catch(() => {});

  process.exit(1);
});
