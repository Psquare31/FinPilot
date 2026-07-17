// ======================================================
// E4 — offset pagination vs cursor pagination, by depth.
//
// shared/repositories/base.repository.js paginates with
// skip: (page - 1) * limit. skip() is not a seek: MongoDB walks and discards
// every skipped document, so the work grows linearly with page number while
// the page returned stays the same size. Page 1 and page 1,000 cost very
// different amounts to serve.
//
// Cursor (keyset) pagination instead asks for "the next 20 after this point",
// which the { workspace: 1, transactionDate: -1 } index can seek to directly.
// Cost is flat in depth.
//
// The comparison is only fair if both return the same page, so each depth is
// verified: the cursor walk and the offset jump must agree document-for-
// document before their timings are compared.
//
// Cursor pagination needs a total order. transactionDate alone is not one —
// two transactions can share a timestamp, and a tie would drop or repeat rows
// across pages. The cursor is therefore (transactionDate, _id).
//
// That tiebreaker has a prerequisite that is easy to miss, and this experiment
// measured nonsense until it was met: the shipped index is
// { workspace: 1, transactionDate: -1 }, which serves sort({transactionDate})
// but NOT sort({transactionDate, _id}) — the extra key is not in the index, so
// MongoDB falls back to a blocking SORT of every matching document. Measured
// here: sorting by transactionDate alone examines 20 documents; adding _id
// examines 32,659. Both paginators then pay a full sort and the comparison
// collapses into noise.
//
// So this experiment builds { workspace: 1, transactionDate: -1, _id: -1 }
// first, and both variants are measured against it. Making a cursor correct
// therefore costs an index — that is part of the trade-off, not a footnote.
//
// Also measured: the count() that base.repository issues on every page, which
// is unindexed work proportional to the whole matched set and is paid on page
// 1 as much as page 1,000.
//
//   node bench/experiments/e4-offset-vs-cursor.js --scale=100000
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

const PAGE_SIZE = 20;

const baseFilter = (workspaceId) => ({
  workspace: workspaceId,
  isDeleted: false,
});

const SORT = { transactionDate: -1, _id: -1 };

// --- offset: what the application does today ---
const offsetPage = (workspaceId, page) =>
  Transaction.find(baseFilter(workspaceId))
    .sort(SORT)
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

// --- cursor: seek straight to the key ---
const cursorPage = (workspaceId, cursor) => {
  const filter = baseFilter(workspaceId);

  if (cursor) {
    // Strictly "after" the last row of the previous page, in (date, _id) order.
    filter.$or = [
      { transactionDate: { $lt: cursor.transactionDate } },
      {
        transactionDate: cursor.transactionDate,
        _id: { $lt: cursor._id },
      },
    ];
  }

  return Transaction.find(filter).sort(SORT).limit(PAGE_SIZE).lean();
};

// Walk pages to find the cursor that starts `page`. This walk is the cost a
// real client never pays — it holds the cursor from the previous page — so it
// is done outside the timed section.
const cursorFor = async (workspaceId, page) => {
  let cursor = null;

  for (let p = 1; p < page; p++) {
    const rows = await cursorPage(workspaceId, cursor);

    if (!rows.length) return { cursor, exhausted: true };

    const last = rows[rows.length - 1];

    cursor = { transactionDate: last.transactionDate, _id: last._id };
  }

  return { cursor, exhausted: false };
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
    scale: Number(args.scale ?? 100000),
    pages: (args.pages ?? "1,10,100,500,1000,1600")
      .split(",")
      .map((p) => Number(p.trim())),
    iterations: Number(args.iterations ?? 15),
    warmup: Number(args.warmup ?? 3),
    seed: Number(args.seed ?? 42),
  };
};

const explainQuery = async (label, query) => {
  const result = await query.explain("executionStats");

  const stats = result.executionStats;

  const chain = [];

  for (let s = stats.executionStages; s; s = s.inputStage) chain.push(s.stage);

  // A blocking SORT means the index is not supplying the order, so the timing
  // would describe an unsupported sort rather than the paginator. That is the
  // fault this experiment was originally measuring without noticing.
  if (chain.includes("SORT")) {
    throw new Error(
      `${label}: plan contains a blocking SORT (${chain.join(" <- ")}). ` +
        `The sort is not index-served, so the measurement is invalid.`
    );
  }

  return stats.totalDocsExamined;
};

const run = async () => {
  const options = parseArgs();

  console.log(`seeding ${options.scale.toLocaleString()} transactions...`);

  await execFileAsync(
    process.execPath,
    [
      path.join("bench", "seed.js"),
      `--transactions=${options.scale}`,
      `--seed=${options.seed}`,
    ],
    { cwd: SERVER_ROOT, maxBuffer: 1024 * 1024 * 32 }
  );

  await connectBenchDB();

  // Supports sort({ transactionDate: -1, _id: -1 }) for both variants. Without
  // it the tiebreaker forces a blocking sort of the whole matched set and the
  // experiment measures that instead of pagination strategy.
  const SORT_INDEX = { workspace: 1, transactionDate: -1, _id: -1 };

  await Transaction.collection.createIndex(SORT_INDEX, {
    name: "workspace_1_transactionDate_-1__id_-1",
  });

  const workspace = await Workspace.findOne().lean();

  const workspaceId = workspace._id;

  const matched = await Transaction.countDocuments(baseFilter(workspaceId));

  const maxPage = Math.ceil(matched / PAGE_SIZE);

  console.log(
    `workspace holds ${matched.toLocaleString()} transactions ` +
      `(${maxPage.toLocaleString()} pages of ${PAGE_SIZE})\n`
  );

  // The count() base.repository runs alongside every page.
  const { stats: countStats } = await measure(
    () => Transaction.countDocuments(baseFilter(workspaceId)),
    { warmup: options.warmup, iterations: options.iterations }
  );

  console.log(
    `  count() issued on every page: p50 ${countStats.p50Ms} ms ` +
      `(paid at every depth, page 1 included)\n`
  );

  const results = [];

  for (const page of options.pages) {
    if (page > maxPage) {
      console.log(`  page ${page}: beyond the end (${maxPage} pages) — skipped`);
      continue;
    }

    const { cursor, exhausted } = await cursorFor(workspaceId, page);

    if (exhausted) {
      console.log(`  page ${page}: cursor walk exhausted — skipped`);
      continue;
    }

    const offsetDocs = await explainQuery(`page ${page} offset`,
      Transaction.find(baseFilter(workspaceId))
        .sort(SORT)
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
    );

    const cursorDocs = await explainQuery(`page ${page} cursor`,
      (() => {
        const filter = baseFilter(workspaceId);

        if (cursor) {
          filter.$or = [
            { transactionDate: { $lt: cursor.transactionDate } },
            { transactionDate: cursor.transactionDate, _id: { $lt: cursor._id } },
          ];
        }

        return Transaction.find(filter).sort(SORT).limit(PAGE_SIZE);
      })()
    );

    const { stats: offsetStats, lastValue: offsetRows } = await measure(
      () => offsetPage(workspaceId, page),
      { warmup: options.warmup, iterations: options.iterations }
    );

    const { stats: cursorStats, lastValue: cursorRows } = await measure(
      () => cursorPage(workspaceId, cursor),
      { warmup: options.warmup, iterations: options.iterations }
    );

    // Both must serve the same page, or the timings describe different work.
    const agree =
      JSON.stringify(offsetRows.map((r) => r._id.toString())) ===
      JSON.stringify(cursorRows.map((r) => r._id.toString()));

    if (!agree) {
      throw new Error(
        `page ${page}: offset and cursor returned different documents; ` +
          `the comparison is invalid.`
      );
    }

    const entry = {
      page,
      skipped: (page - 1) * PAGE_SIZE,
      agree,
      offset: { ...offsetStats, totalDocsExamined: offsetDocs },
      cursor: { ...cursorStats, totalDocsExamined: cursorDocs },
      ratio: Number(
        (offsetStats.p50Ms / Math.max(cursorStats.p50Ms, 0.001)).toFixed(2)
      ),
    };

    results.push(entry);

    console.log(
      `  page ${String(page).padStart(5)}  ` +
        `offset: examined ${String(offsetDocs).padStart(6)} p50 ${String(offsetStats.p50Ms).padStart(7)} ms   ` +
        `cursor: examined ${String(cursorDocs).padStart(3)} p50 ${String(cursorStats.p50Ms).padStart(6)} ms   ` +
        `(${entry.ratio}x)`
    );
  }

  const report = {
    experiment: "E4 — offset vs cursor pagination by depth",
    generatedAt: new Date().toISOString(),
    pageSize: PAGE_SIZE,
    sort: "transactionDate desc, _id desc",
    workspaceMatchedDocs: matched,
    countPerPage: countStats,
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

  const outPath = path.join(RESULTS_DIR, "e4-offset-vs-cursor.json");

  await fs.writeFile(outPath, JSON.stringify(report, null, 2));

  console.log(`\nWrote ${path.relative(SERVER_ROOT, outPath)}`);

  await disconnectBenchDB();
};

run().catch(async (error) => {
  console.error(error);

  await disconnectBenchDB().catch(() => {});

  process.exit(1);
});
