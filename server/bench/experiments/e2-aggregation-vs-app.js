// ======================================================
// E2 — Database-side $group vs application-side summation.
//
// FinPilot's dashboard service computes summaries two different ways:
//   - getTransactionSummary  -> Transaction.aggregate([$match, $group])
//   - getAccountSummary /
//     getBudgetSummary /
//     getInvestmentSummary   -> Model.find().lean() then reduce() in Node
//
// Both patterns are already in the codebase, applied to the same class of
// problem. This experiment applies all three strategies to one identical
// question — income/expense totals for a workspace — across increasing
// transaction counts, to quantify what that inconsistency costs.
//
// Strategies:
//   A. aggregate  — $group in MongoDB, one small document returned
//   B. app-full   — find().lean() over full documents, reduce in Node
//                   (this is the pattern the dashboard actually uses elsewhere)
//   C. app-proj   — find().select(...).lean(), reduce in Node
//                   (the fair version of B: only the fields needed)
//
//   node bench/experiments/e2-aggregation-vs-app.js --scales=1000,10000,100000
// ======================================================

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectBenchDB, { disconnectBenchDB } from "../lib/db.js";
import { measure } from "../lib/stats.js";

import Workspace from "../../src/models/Workspace.js";
import Transaction from "../../src/models/Transaction.js";

import toObjectId from "../../src/utils/toObjectId.js";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVER_ROOT = path.resolve(__dirname, "../..");

const RESULTS_DIR = path.join(SERVER_ROOT, "bench", "results");

// ======================================================
// Strategies
// ======================================================

// A — group in the database, return one document per type.
const aggregate = async (workspaceId) => {
  const rows = await Transaction.aggregate([
    { $match: { workspace: toObjectId(workspaceId), isDeleted: false } },
    { $group: { _id: "$type", total: { $sum: "$money.amount" } } },
  ]);

  const income = rows.find((r) => r._id === "income")?.total ?? 0;
  const expense = rows.find((r) => r._id === "expense")?.total ?? 0;

  return { income, expense, cashFlow: income - expense };
};

// B — pull whole documents to Node and reduce. Mirrors the dashboard's
// existing find().lean() + reduce() pattern.
const appFull = async (workspaceId) => {
  const docs = await Transaction.find({
    workspace: workspaceId,
    isDeleted: false,
  }).lean();

  let income = 0;
  let expense = 0;

  for (const doc of docs) {
    if (doc.type === "income") income += doc.money.amount;
    else if (doc.type === "expense") expense += doc.money.amount;
  }

  return { income, expense, cashFlow: income - expense };
};

// C — same as B but projecting only the two fields the sum needs.
const appProjected = async (workspaceId) => {
  const docs = await Transaction.find({
    workspace: workspaceId,
    isDeleted: false,
  })
    .select("type money.amount -_id")
    .lean();

  let income = 0;
  let expense = 0;

  for (const doc of docs) {
    if (doc.type === "income") income += doc.money.amount;
    else if (doc.type === "expense") expense += doc.money.amount;
  }

  return { income, expense, cashFlow: income - expense };
};

const STRATEGIES = [
  { id: "aggregate", label: "A. $group in MongoDB", fn: aggregate },
  { id: "app-full", label: "B. find().lean() + reduce (full docs)", fn: appFull },
  { id: "app-proj", label: "C. find().select() + reduce (projected)", fn: appProjected },
];

// ======================================================
// Harness
// ======================================================

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

const reseed = async (transactions, seed) => {
  // Spawned rather than imported so bench/seed.js stays the single source of
  // truth for how a dataset is built.
  await execFileAsync(
    process.execPath,
    [
      path.join("bench", "seed.js"),
      `--transactions=${transactions}`,
      `--seed=${seed}`,
    ],
    { cwd: SERVER_ROOT, maxBuffer: 1024 * 1024 * 32 }
  );
};

const run = async () => {
  const options = parseArgs();

  const results = [];

  for (const scale of options.scales) {
    console.log(`\n=== scale: ${scale.toLocaleString()} transactions ===`);

    console.log("seeding...");

    await reseed(scale, options.seed);

    await connectBenchDB();

    const workspace = await Workspace.findOne().lean();

    const workspaceId = workspace._id;

    const matched = await Transaction.countDocuments({
      workspace: workspaceId,
      isDeleted: false,
    });

    console.log(`workspace ${workspaceId} matches ${matched.toLocaleString()} docs`);

    // Ground truth, independent of any strategy under test.
    const truthRows = await Transaction.aggregate([
      { $match: { workspace: workspaceId, isDeleted: false } },
      { $group: { _id: "$type", total: { $sum: "$money.amount" } } },
    ]);

    const truth = {
      income: truthRows.find((r) => r._id === "income")?.total ?? 0,
      expense: truthRows.find((r) => r._id === "expense")?.total ?? 0,
    };

    const scaleResult = {
      scale,
      workspaceMatchedDocs: matched,
      truth,
      strategies: {},
    };

    for (const strategy of STRATEGIES) {
      // Correctness gate. A strategy that returns the wrong number must not be
      // compared on speed — the original $sum:"$amount" pipeline was the
      // fastest option precisely because it summed nothing.
      const check = await strategy.fn(workspaceId);

      const correct =
        check.income === truth.income && check.expense === truth.expense;

      if (!correct) {
        throw new Error(
          `${strategy.id} disagrees with ground truth ` +
            `(income ${check.income} vs ${truth.income}, ` +
            `expense ${check.expense} vs ${truth.expense})`
        );
      }

      global.gc?.();

      const heapBefore = process.memoryUsage().heapUsed;

      const { stats } = await measure(() => strategy.fn(workspaceId), {
        warmup: options.warmup,
        iterations: options.iterations,
      });

      const heapAfter = process.memoryUsage().heapUsed;

      scaleResult.strategies[strategy.id] = {
        label: strategy.label,
        correct,
        ...stats,
        heapDeltaBytes: heapAfter - heapBefore,
      };

      console.log(
        `  ${strategy.label.padEnd(40)} ` +
          `p50 ${String(stats.p50Ms).padStart(9)} ms  ` +
          `p95 ${String(stats.p95Ms).padStart(9)} ms`
      );
    }

    // Headline ratio: what the app-level pattern costs versus $group.
    const agg = scaleResult.strategies.aggregate.p50Ms;

    scaleResult.ratios = {
      appFullVsAggregate: Number(
        (scaleResult.strategies["app-full"].p50Ms / agg).toFixed(2)
      ),
      appProjectedVsAggregate: Number(
        (scaleResult.strategies["app-proj"].p50Ms / agg).toFixed(2)
      ),
    };

    console.log(
      `  -> app-full is ${scaleResult.ratios.appFullVsAggregate}x slower than $group; ` +
        `app-proj ${scaleResult.ratios.appProjectedVsAggregate}x`
    );

    results.push(scaleResult);

    await disconnectBenchDB();
  }

  const report = {
    experiment: "E2 — database-side $group vs application-side summation",
    generatedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: (await import("node:os")).cpus().length,
    },
    options,
    results,
  };

  await fs.mkdir(RESULTS_DIR, { recursive: true });

  const outPath = path.join(RESULTS_DIR, "e2-aggregation-vs-app.json");

  await fs.writeFile(outPath, JSON.stringify(report, null, 2));

  console.log(`\nWrote ${path.relative(SERVER_ROOT, outPath)}`);
};

run().catch(async (error) => {
  console.error(error);

  await disconnectBenchDB().catch(() => {});

  process.exit(1);
});
