// Regression check across the services fixed so far. Compares each against
// independently computed ground truth, using the real service objects called
// the way controllers call them (string ids straight off req.query).

import connectBenchDB, { disconnectBenchDB } from "./lib/db.js";
import Workspace from "../src/models/Workspace.js";
import Transaction from "../src/models/Transaction.js";

import dashboardService from "../src/services/dashboard.service.js";
import transactionService from "../src/services/transaction.service.js";

await connectBenchDB();

const workspace = await Workspace.findOne().lean();
const id = workspace._id;
const idString = id.toString();

const truthRows = await Transaction.aggregate([
  { $match: { workspace: id, isDeleted: false } },
  { $group: { _id: "$type", total: { $sum: "$money.amount" } } },
]);

const truth = {
  income: truthRows.find((r) => r._id === "income")?.total ?? 0,
  expense: truthRows.find((r) => r._id === "expense")?.total ?? 0,
};

// Includes soft-deleted, matching these pipelines' (unchanged) semantics.
const truthAllRows = await Transaction.aggregate([
  { $match: { workspace: id } },
  { $group: { _id: "$type", total: { $sum: "$money.amount" } } },
]);

const truthAll = {
  income: truthAllRows.find((r) => r._id === "income")?.total ?? 0,
  expense: truthAllRows.find((r) => r._id === "expense")?.total ?? 0,
};

const checks = [];

const check = (name, actual, expected) => {
  const pass = actual === expected;
  checks.push({ name, pass, actual, expected });
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${name.padEnd(46)} ${actual} ${pass ? "" : `(expected ${expected})`}`
  );
};

const dash = await dashboardService.getTransactionSummary(idString);
check("dashboard.getTransactionSummary income", dash.income, truth.income);
check("dashboard.getTransactionSummary expense", dash.expense, truth.expense);

const ive = await transactionService.getIncomeVsExpense(idString);
const iveIncome = ive.find?.((r) => r._id === "income")?.total ?? ive.income;
console.log("\n  transaction.getIncomeVsExpense raw:", JSON.stringify(ive).slice(0, 160));

const byCategory = await transactionService.getSpendingByCategory(idString);
console.log("  getSpendingByCategory rows:", byCategory.length);
console.log(
  "  getSpendingByCategory total:",
  byCategory.reduce((s, r) => s + r.total, 0),
  "| ground truth (incl. deleted) expense:",
  truthAll.expense
);

const stats = await transactionService.getTransactionStatistics(idString);
console.log("  getTransactionStatistics:", JSON.stringify(stats).slice(0, 200));

console.log(
  `\n${checks.every((c) => c.pass) ? "ALL CHECKS PASS" : "SOME CHECKS FAILED"}`
);

if (!checks.every((c) => c.pass)) process.exitCode = 1;

await disconnectBenchDB();
